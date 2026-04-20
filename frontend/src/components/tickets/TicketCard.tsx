import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import type { Ticket } from '../../types'
import { StatusBadge, PriorityDot } from './StatusBadge'
import SLAChip from './SLAChip'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Props {
  ticket: Ticket
  linkTo: string
  onDelete?: (id: string) => void
  deleteError?: string | null
}

export default function TicketCard({ ticket, linkTo, onDelete, deleteError }: Props) {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  // Auto-reset confirm state after 3s so onBlur doesn't cause race condition
  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    onDelete?.(ticket.id)
    setConfirming(false)
  }

  return (
    <div
      onClick={() => navigate(linkTo)}
      className="rounded-xl p-4 border cursor-pointer transition-colors hover:border-accent"
      style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-mono" style={{ color: 'var(--color-txt3)' }}>{ticket.ticket_number}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>{timeAgo(ticket.created_at)}</span>
          {onDelete && (
            <button
              onClick={handleDelete}
              title={confirming ? 'Click again to confirm delete' : 'Delete ticket'}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors"
              style={{
                background: confirming ? 'var(--bg-danger-15)' : 'transparent',
                color: confirming ? 'var(--color-danger)' : 'var(--color-txt3)',
              }}
            >
              <Trash2 size={13} />
              {confirming && <span>Confirm?</span>}
            </button>
          )}
        </div>
      </div>
      {deleteError && (
        <p className="text-xs mb-1 px-2 py-1 rounded" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
          {deleteError}
        </p>
      )}
      <p className="text-sm font-medium mb-1 line-clamp-2" style={{ color: 'var(--color-txt1)' }}>{ticket.title}</p>
      {ticket.company && (
        <p className="text-xs mb-2" style={{ color: 'var(--color-txt2)' }}>{ticket.company.name}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={ticket.status} />
        <PriorityDot priority={ticket.priority} />
        <SLAChip sla_due_at={ticket.sla_due_at} />
      </div>
    </div>
  )
}
