import axios from 'axios'
import { prisma } from '../lib/prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

// Table column widths (JS string length, not visual — emojis like 🔴🟡🟢📊 are 2 JS chars = 2 visual)
const LABEL_W = 14  // fits "🟡 In Progress" exactly (2+1+11 = 14)
const NUM_W = 5

function center(text: string, width: number): string {
  const pad = width - text.length
  const l = Math.floor(pad / 2)
  const r = pad - l
  return ' '.repeat(Math.max(0, l)) + text + ' '.repeat(Math.max(0, r))
}

function makeTable(title: string, rows: [string, number][]): string {
  const top = `┌${'─'.repeat(24)}┐`
  const header = `│ ${center(title, 23)}│`
  const mid = `├${'─'.repeat(16)}┬${'─'.repeat(7)}┤`
  const bottom = `└${'─'.repeat(16)}┴${'─'.repeat(7)}┘`
  const row = (label: string, value: number) =>
    `│ ${label.padEnd(LABEL_W)} │ ${String(value).padStart(NUM_W)} │`

  return [top, header, mid, ...rows.map(([l, v]) => row(l, v)), bottom].join('\n')
}

function escHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function buildAndSendReport(days: number): Promise<void> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const where = { created_at: { gte: since } }

  const [open, inProgress, closed, priority] = await Promise.all([
    prisma.ticket.count({ where: { ...where, status: 'open' } }),
    prisma.ticket.count({ where: { ...where, status: 'in_progress' } }),
    prisma.ticket.count({ where: { ...where, status: 'closed' } }),
    prisma.ticket.count({ where: { ...where, is_priority: true } }),
  ])
  const total = open + inProgress + closed

  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  const [cemStatusRaw, cemPriorityRaw] = await Promise.all([
    prisma.ticket.groupBy({ by: ['raised_by', 'status'], where, _count: { id: true } }),
    prisma.ticket.groupBy({ by: ['raised_by'], where: { ...where, is_priority: true }, _count: { id: true } }),
  ])

  const cemMap = new Map<string, { open: number; in_progress: number; closed: number; priority: number }>()
  for (const r of cemStatusRaw) {
    if (!cemMap.has(r.raised_by)) cemMap.set(r.raised_by, { open: 0, in_progress: 0, closed: 0, priority: 0 })
    const e = cemMap.get(r.raised_by)!
    if (r.status === 'open') e.open += r._count.id
    else if (r.status === 'in_progress') e.in_progress += r._count.id
    else if (r.status === 'closed') e.closed += r._count.id
  }
  for (const r of cemPriorityRaw) {
    if (cemMap.has(r.raised_by)) cemMap.get(r.raised_by)!.priority = r._count.id
  }

  const cemRows = users
    .filter(u => cemMap.has(u.id))
    .map(u => {
      const d = cemMap.get(u.id)!
      return { name: u.name, total: d.open + d.in_progress + d.closed, ...d }
    })

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })

  const isMonthly = days === 30
  const rangeLabel = isMonthly ? 'Last 30 Days' : 'Last 7 Days'

  const tableRows: [string, number][] = [
    ['📊 Total', total],
    ['🔴 Open', open],
    ['🟡 In Progress', inProgress],
    ['🟢 Closed', closed],
    ['🚨 Priority', priority],
  ]

  const greeting = isMonthly
    ? ` <b>Monthly Snapshot — Last 30 Days</b>`
    : `☀️ <b>Good Morning all!</b>`

  const parts: string[] = [
    greeting,
    ``,
    `📋 <b>Canvas Ticket Report</b>`,
    `<i>${escHtml(dateStr)} · ${timeStr}</i>`,
    ``,
    `<pre>${makeTable(`Overall · ${rangeLabel}`, tableRows)}</pre>`,
  ]

  for (const cem of cemRows) {
    const cemTableRows: [string, number][] = [
      ['📊 Total', cem.total],
      ['🔴 Open', cem.open],
      ['🟡 In Progress', cem.in_progress],
      ['🟢 Closed', cem.closed],
      ['🚨 Priority', cem.priority],
    ]
    parts.push(``, `<pre>${makeTable(cem.name, cemTableRows)}</pre>`)
  }

  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: parts.join('\n'),
    parse_mode: 'HTML',
  })
}

export async function sendDailyReport(): Promise<void> { return buildAndSendReport(7) }
export async function sendMonthlyReport(): Promise<void> { return buildAndSendReport(30) }
