import { useNavigate } from 'react-router-dom'
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
}

export default function TicketCard({ ticket, linkTo }: Props) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(linkTo)}
      className="rounded-xl p-4 border cursor-pointer transition-colors hover:border-accent"
      style={{ background: '#1f2330', borderColor: '#2e3545' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-mono" style={{ color: '#565e72' }}>{ticket.ticket_number}</span>
        <span className="text-xs shrink-0" style={{ color: '#565e72' }}>{timeAgo(ticket.created_at)}</span>
      </div>
      <p className="text-sm font-medium mb-1 line-clamp-2" style={{ color: '#e8eaf0' }}>{ticket.title}</p>
      {ticket.company && (
        <p className="text-xs mb-2" style={{ color: '#8b92a5' }}>{ticket.company.name}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={ticket.status} />
        <PriorityDot priority={ticket.priority} />
        <SLAChip sla_due_at={ticket.sla_due_at} />
      </div>
    </div>
  )
}
