import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, CheckCircle, Calendar, ArrowUpDown } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { type Period, todayStr, periodToParams } from '../../lib/periodParams'

function fmtShort(date?: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function getCategoryName(category: any): string {
  if (!category) return ''
  if (typeof category === 'string') return category.replace(/_/g, ' ')
  return category.name
}

const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  client: { label: 'Client Reported', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  cem:    { label: 'CEM Observed',    bg: 'rgba(6,182,212,0.15)',  color: '#06b6d4' },
}

interface MiniCardProps { ticket: any; linkTo: string }

function MiniCard({ ticket, linkTo }: MiniCardProps) {
  const navigate = useNavigate()
  const category = getCategoryName(ticket.category)
  const badge = SOURCE_BADGE[ticket.source]
  const isOverdue = ticket.status === 'open' && ticket.opened_at
    && (Date.now() - new Date(ticket.opened_at).getTime()) > 24 * 3_600_000

  return (
    <div
      onClick={() => navigate(linkTo)}
      className="rounded-xl border cursor-pointer active:opacity-70 relative"
      style={{
        background: 'var(--color-bg0)',
        borderColor: isOverdue ? '#ef4444' : 'var(--color-bg4)',
      }}
    >
      {isOverdue && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#ef4444' }} />
          <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: '#ef4444' }} />
        </span>
      )}
      <div className="px-3 py-2.5 flex gap-2">
        {/* Left: 3 lines */}
        <div className="flex-1 min-w-0">
          {/* Line 1: #number + category + source badge */}
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="font-bold text-xs shrink-0" style={{ color: 'var(--color-txt1)' }}>
              #{ticket.ticket_number}
            </span>
            <span className="text-xs capitalize truncate" style={{ color: 'var(--color-txt2)' }}>
              {category}
            </span>
            {badge && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: badge.bg, color: badge.color, fontSize: 10 }}>
                {badge.label}
              </span>
            )}
          </div>
          {/* Line 2: building · floor · client as pills */}
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            {ticket.building?.name && (
              <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)', fontSize: 10 }}>
                {ticket.building.name}
              </span>
            )}
            {ticket.floor?.name && (
              <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)', fontSize: 10 }}>
                {ticket.floor.name}
              </span>
            )}
            {ticket.client?.name && (
              <span className="px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)', fontSize: 10 }}>
                {ticket.client.name}
              </span>
            )}
          </div>
          {/* Line 3: sub-category */}
          {ticket.sub_category && (
            <p className="truncate" style={{ color: 'var(--color-txt3)', fontSize: 10 }}>
              {ticket.sub_category}
            </p>
          )}
        </div>
        {/* Right: status timestamps */}
        <div className="flex flex-col gap-0.5 shrink-0 items-end justify-center">
          {ticket.opened_at && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#ef4444' }} />
              <span style={{ color: 'var(--color-txt3)', fontSize: 10 }}>{fmtShort(ticket.opened_at)}</span>
            </div>
          )}
          {ticket.in_progress_at && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#f59e0b' }} />
              <span style={{ color: 'var(--color-txt3)', fontSize: 10 }}>{fmtShort(ticket.in_progress_at)}</span>
            </div>
          )}
          {ticket.closed_at && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#22c55e' }} />
              <span style={{ color: 'var(--color-txt3)', fontSize: 10 }}>{fmtShort(ticket.closed_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const COLUMNS = [
  {
    key: 'open' as const,
    label: 'Open',
    icon: Ticket,
    borderColor: 'var(--color-danger)',
    badgeBg: 'var(--bg-danger-10)',
    badgeColor: 'var(--color-danger)',
    emptyText: 'No open tickets',
  },
  {
    key: 'in_progress' as const,
    label: 'In Progress',
    icon: Clock,
    borderColor: 'var(--color-warning)',
    badgeBg: 'var(--bg-warning-15)',
    badgeColor: 'var(--color-warning)',
    emptyText: 'No tickets in progress',
  },
  {
    key: 'closed' as const,
    label: 'Closed',
    icon: CheckCircle,
    borderColor: 'var(--color-success)',
    badgeBg: 'var(--color-bg3)',
    badgeColor: 'var(--color-txt3)',
    emptyText: 'No closed tickets',
  },
]

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d',     label: '7 Days' },
  { value: '30d',    label: '30 Days' },
  { value: 'all',    label: 'All Time' },
  { value: 'custom', label: 'Custom' },
]

interface Props {
  linkPrefix: string
}

export default function KanbanBoard({ linkPrefix }: Props) {
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())
  const [activeTab, setActiveTab] = useState<'open' | 'in_progress' | 'closed'>('open')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const params = useMemo(
    () => periodToParams(period, customFrom, customTo),
    [period, customFrom, customTo]
  )

  const { data, isLoading } = useTickets(params)
  const allTickets: any[] = useMemo(() => {
    const tickets: any[] = data?.tickets || []
    return [...tickets].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })
  }, [data, sortOrder])

  const buckets: Record<string, any[]> = {
    open:        allTickets.filter((t: any) => t.status === 'open'),
    in_progress: allTickets.filter((t: any) => t.status === 'in_progress'),
    closed:      allTickets.filter((t: any) => t.status === 'closed'),
  }

  const totalVisible = allTickets.length

  return (
    <div className="pb-8">

      {/* Top bar: period filter + count */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
            style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)' }}
            title={sortOrder === 'asc' ? 'Oldest first (FIFO)' : 'Newest first'}
          >
            <ArrowUpDown size={12} />
            {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
          </button>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-bg1)', border: '1px solid var(--color-bg4)' }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: period === p.value ? 'var(--color-accent)' : 'transparent',
                  color: period === p.value ? '#fff' : 'var(--color-txt3)',
                }}
              >
                {p.value === 'custom' && <Calendar size={12} />}
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={customFrom} max={customTo || todayStr()}
                onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg px-3 text-xs outline-none border h-8"
                style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }} />
              <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>to</span>
              <input type="date" value={customTo} min={customFrom} max={todayStr()}
                onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg px-3 text-xs outline-none border h-8"
                style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }} />
            </div>
          )}
        </div>
        {!isLoading && (
          <p className="text-xs shrink-0" style={{ color: 'var(--color-txt3)' }}>
            {totalVisible} ticket{totalVisible !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── MOBILE: tab switcher + single column ── */}
      <div className="md:hidden px-4 pb-4">
        {/* Tab bar */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl mb-3" style={{ background: 'var(--color-bg1)', border: '1px solid var(--color-bg4)' }}>
          {COLUMNS.map(col => {
            const Icon = col.icon
            const count = isLoading ? '–' : buckets[col.key].length
            const active = activeTab === col.key
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold"
                style={{
                  background: active ? 'var(--color-bg3)' : 'transparent',
                  color: active ? col.borderColor : 'var(--color-txt3)',
                  borderBottom: active ? `2px solid ${col.borderColor}` : '2px solid transparent',
                }}
              >
                <Icon size={13} />
                {col.label}
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? col.badgeBg : 'var(--color-bg3)',
                    color: active ? col.badgeColor : 'var(--color-txt3)',
                    fontSize: 10,
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active column content */}
        {COLUMNS.filter(col => col.key === activeTab).map(col => {
          const tickets = buckets[col.key]
          return (
            <div key={col.key} className="flex flex-col gap-2">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-bg2)' }} />
                ))
              ) : tickets.length === 0 ? (
                <div
                  className="rounded-2xl border-2 border-dashed flex items-center justify-center py-16"
                  style={{ borderColor: 'var(--color-bg4)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-txt3)' }}>{col.emptyText}</p>
                </div>
              ) : (
                tickets.map((t: any) => (
                  <MiniCard key={t.id} ticket={t} linkTo={`${linkPrefix}/${t.id}`} />
                ))
              )}
            </div>
          )
        })}
      </div>

      {/* ── DESKTOP: 3-column grid ── */}
      <div className="hidden md:grid p-4 pt-2 grid-cols-3 gap-4 items-start">
        {COLUMNS.map(col => {
          const tickets = buckets[col.key]
          const Icon = col.icon
          return (
            <div
              key={col.key}
              className="rounded-2xl border flex flex-col overflow-hidden"
              style={{
                background: 'var(--color-bg1)',
                borderColor: 'var(--color-bg4)',
                borderTopWidth: 4,
                borderTopColor: col.borderColor,
                borderTopStyle: 'solid',
                minHeight: 400,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-bg4)' }}>
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: col.borderColor }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{col.label}</span>
                </div>
                <span
                  className="text-xs font-bold min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center"
                  style={{ background: col.badgeBg, color: col.badgeColor }}
                >
                  {isLoading ? '–' : tickets.length}
                </span>
              </div>
              <div className="p-3">
                {isLoading ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-bg2)' }} />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div
                    className="rounded-xl border-2 border-dashed flex items-center justify-center py-20"
                    style={{ borderColor: 'var(--color-bg4)' }}
                  >
                    <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>{col.emptyText}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tickets.map((t: any) => (
                      <MiniCard key={t.id} ticket={t} linkTo={`${linkPrefix}/${t.id}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
