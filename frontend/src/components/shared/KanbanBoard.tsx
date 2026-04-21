import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, CheckCircle } from 'lucide-react'

type Period = 'all' | 'week' | 'month'

function getStartOf(period: Period): Date | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    d.setHours(0, 0, 0, 0)
    return d
  }
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function filterByPeriod(tickets: any[], period: Period): any[] {
  const start = getStartOf(period)
  if (!start) return tickets
  return tickets.filter(t => new Date(t.created_at) >= start)
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getCategoryName(category: any): string {
  if (!category) return ''
  if (typeof category === 'string') return category.replace(/_/g, ' ')
  return category.name
}

interface MiniCardProps { ticket: any; linkTo: string }

function MiniCard({ ticket, linkTo }: MiniCardProps) {
  const navigate = useNavigate()
  const category = getCategoryName(ticket.category)
  return (
    <div
      onClick={() => navigate(linkTo)}
      className="rounded-xl border cursor-pointer active:scale-[0.99]"
      style={{ background: 'var(--color-bg0)', borderColor: 'var(--color-bg4)' }}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs font-bold capitalize leading-snug" style={{ color: 'var(--color-txt1)' }}>
            {category}
          </p>
          <span className="text-xs shrink-0" style={{ color: 'var(--color-txt3)', fontSize: 11 }}>{fmtDate(ticket.created_at)}</span>
        </div>
        {ticket.sub_category && (
          <p className="text-xs mb-1.5" style={{ color: 'var(--color-txt2)' }}>{ticket.sub_category}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {ticket.company && (
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)' }}>
              {ticket.company.name}
            </span>
          )}
          {ticket.building && (
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)' }}>
              {ticket.building.name}
            </span>
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
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all',   label: 'All Time' },
]

interface Props {
  open: any[]
  inProgress: any[]
  closed: any[]
  isLoading: boolean
  linkPrefix: string
}

export default function KanbanBoard({ open, inProgress, closed, isLoading, linkPrefix }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const [activeTab, setActiveTab] = useState<'open' | 'in_progress' | 'closed'>('open')

  const buckets: Record<string, any[]> = {
    open:        filterByPeriod(open, period),
    in_progress: filterByPeriod(inProgress, period),
    closed:      filterByPeriod(closed, period),
  }

  const totalVisible = buckets.open.length + buckets.in_progress.length + buckets.closed.length

  return (
    <div className="pb-8">

      {/* Top bar: period filter + count */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-bg1)', border: '1px solid var(--color-bg4)' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: period === p.value ? 'var(--color-accent)' : 'transparent',
                color: period === p.value ? '#fff' : 'var(--color-txt3)',
              }}
            >
              {p.label}
            </button>
          ))}
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
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
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
