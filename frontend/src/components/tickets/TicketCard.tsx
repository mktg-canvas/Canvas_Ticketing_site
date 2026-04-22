import { useNavigate } from 'react-router-dom'
import type { Ticket } from '../../types'

const STATUS_BORDER: Record<string, string> = {
  open:        'var(--color-danger)',
  in_progress: 'var(--color-warning)',
  closed:      'var(--color-success)',
}

const STATUS_DOT: Record<string, string> = {
  open:        'var(--color-danger)',
  in_progress: 'var(--color-warning)',
  closed:      'var(--color-success)',
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getCategoryName(category: Ticket['category']): string {
  if (!category) return ''
  if (typeof category === 'string') return category.replace(/_/g, ' ')
  return (category as { name: string }).name
}

interface Props {
  ticket: Ticket
  linkTo: string
  deleteError?: string | null
}

export default function TicketCard({ ticket, linkTo, deleteError }: Props) {
  const navigate = useNavigate()
  const borderColor = STATUS_BORDER[ticket.status] || STATUS_BORDER.open
  const dotColor = STATUS_DOT[ticket.status] || STATUS_DOT.open
  const category = getCategoryName(ticket.category)

  return (
    <div
      onClick={() => navigate(linkTo)}
      className="rounded-2xl border cursor-pointer active:opacity-70"
      style={{
        background: 'var(--color-bg1)',
        borderColor: 'var(--color-bg4)',
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        borderLeftStyle: 'solid',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="px-4 py-3.5">
        {/* Category + time */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
            <p className="text-sm font-bold capitalize leading-snug" style={{ color: 'var(--color-txt1)' }}>
              {category}
            </p>
          </div>
          <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--color-txt3)' }}>
            {fmtDate(ticket.created_at)}
          </span>
        </div>

        {/* Sub-category */}
        {ticket.sub_category && (
          <p className="text-xs mb-3 ml-4" style={{ color: 'var(--color-txt2)' }}>
            {ticket.sub_category}
          </p>
        )}

        {/* Company + Building */}
        <div className="flex items-center gap-2 flex-wrap ml-4" style={{ marginTop: ticket.sub_category ? 0 : 8 }}>
          {ticket.company && (
            <span
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
            >
              {ticket.company.name}
            </span>
          )}
          {ticket.building && (
            <span
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
            >
              {ticket.building.name}
            </span>
          )}
        </div>

        {deleteError && (
          <p className="text-xs mt-2 px-2 py-1 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
            {deleteError}
          </p>
        )}
      </div>
    </div>
  )
}
