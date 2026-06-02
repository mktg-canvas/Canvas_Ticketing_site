import axios from 'axios'
import { prisma } from '../lib/prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function toHandle(name: string): string {
  // Derives @handle from the first word of the user's name (lowercased).
  // If you want real Telegram pings, add a telegram_username column to users
  // and use that here instead.
  return '@' + name.trim().split(/\s+/)[0].toLowerCase()
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function sendMessage(text: string): Promise<void> {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML',
  })
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
    .sort((a, b) => b.total - a.total)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  })

  const isMonthly = days === 30
  const rangeLabel = isMonthly ? 'Last 30 Days' : 'Last 7 Days'
  const greeting = isMonthly ? '📆 <b>Monthly Snapshot</b>' : '☀️ <b>Good Morning!</b>'

  // ── Message 1: overall summary ──────────────────────────────────────────
  await sendMessage([
    greeting,
    '',
    `📋 <b>Canvas Ticket Report</b>  ·  <i>${escHtml(rangeLabel)}</i>`,
    `<i>${escHtml(dateStr)} · ${timeStr}</i>`,
    '',
    `📊 Total         <b>${total}</b>`,
    `🔴 Open          <b>${open}</b>`,
    `🟡 In Progress   <b>${inProgress}</b>`,
    `🟢 Closed        <b>${closed}</b>`,
    ...(priority > 0 ? [`🚨 Priority      <b>${priority}</b>`] : []),
  ].join('\n'))

  // ── One message per CEM ─────────────────────────────────────────────────
  for (const cem of cemRows) {
    await sleep(500) // stay well under Telegram's 1 msg/s per-chat limit
    await sendMessage([
      `👤 <b>${escHtml(cem.name)}</b>  ${toHandle(cem.name)}`,
      '',
      `📊 Total         <b>${cem.total}</b>`,
      `🔴 Open          <b>${cem.open}</b>`,
      `🟡 In Progress   <b>${cem.in_progress}</b>`,
      `🟢 Closed        <b>${cem.closed}</b>`,
      ...(cem.priority > 0 ? [`🚨 Priority      <b>${cem.priority}</b>`] : []),
    ].join('\n'))
  }
}

export async function sendDailyReport(): Promise<void> { return buildAndSendReport(7) }
export async function sendMonthlyReport(): Promise<void> { return buildAndSendReport(30) }
