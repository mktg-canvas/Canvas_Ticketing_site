import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Lock } from 'lucide-react'
import { useTicket, useUpdateStatus, useAddComment } from '../../hooks/useTickets'
import { StatusBadge, PriorityDot } from '../../components/tickets/StatusBadge'
import SLAChip from '../../components/tickets/SLAChip'

const NEXT_STATUSES = ['open','acknowledged','in_progress','on_hold','resolved','closed']

function timeStr(d: string) {
  return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ticket, isLoading } = useTicket(id!)
  const { mutateAsync: updateStatus } = useUpdateStatus()
  const { mutateAsync: addComment, isPending: sending } = useAddComment()
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showStatusSheet, setShowStatusSheet] = useState(false)

  async function handleStatus(newStatus: string) {
    await updateStatus({ id: id!, status: newStatus })
    setShowStatusSheet(false)
  }

  async function handleSend() {
    if (!comment.trim()) return
    await addComment({ id: id!, comment, isInternal })
    setComment('')
  }

  if (isLoading) return <div className="p-6 flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-20 rounded-xl animate-pulse" style={{background:'#1f2330'}}/>)}</div>
  if (!ticket) return <div className="p-6 text-center" style={{color:'#8b92a5'}}>Ticket not found.</div>

  return (
    <div className="min-h-screen pb-32" style={{ background: '#0f1117' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3 flex-wrap" style={{ background: '#181c24', borderColor: '#2e3545' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft size={18} style={{ color: '#8b92a5' }} /></button>
        <span className="text-xs font-mono" style={{ color: '#565e72' }}>{ticket.ticket_number}</span>
        <StatusBadge status={ticket.status} />
        <SLAChip sla_due_at={ticket.sla_due_at} />
        <span className="ml-auto text-xs" style={{ color: '#8b92a5' }}>{ticket.company?.name}</span>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-base font-semibold mb-2" style={{ color: '#e8eaf0' }}>{ticket.title}</h1>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <PriorityDot priority={ticket.priority} />
          <span className="text-xs capitalize" style={{ color: '#8b92a5' }}>{ticket.category}</span>
          <span className="text-xs" style={{ color: '#565e72' }}>Raised by {ticket.raiser?.name}</span>
        </div>

        <div className="rounded-xl p-4 mb-4 border" style={{ background: '#1f2330', borderColor: '#2e3545' }}>
          <p className="text-sm" style={{ color: '#e8eaf0' }}>{ticket.description}</p>
        </div>

        {/* Activity timeline */}
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#565e72' }}>Timeline</h2>
        <div className="flex flex-col gap-3 mb-4">
          {ticket.activities.map((a: any) => (
            <div key={a.id}>
              {a.activity_type === 'status_changed' ? (
                <div className="text-center py-1">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#262c3a', color: '#8b92a5' }}>
                    {a.actor.name} → <strong style={{ color: '#e8eaf0' }}>{a.new_value?.replace(/_/g,' ')}</strong> · {timeStr(a.created_at)}
                  </span>
                </div>
              ) : a.comment ? (
                <div className="rounded-xl p-3 border" style={{
                  background: a.is_internal ? 'rgba(245,166,35,0.05)' : '#1f2330',
                  borderColor: a.is_internal ? 'rgba(245,166,35,0.3)' : '#2e3545',
                  borderLeftWidth: a.is_internal ? 3 : 1,
                  borderLeftColor: a.is_internal ? '#f5a623' : '#2e3545',
                }}>
                  {a.is_internal && <p className="text-xs mb-1 font-medium" style={{ color: '#f5a623' }}>Internal — not visible to client</p>}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium" style={{ color: '#e8eaf0' }}>{a.actor.name}</span>
                    <span className="text-xs capitalize px-1.5 py-0.5 rounded" style={{ background: '#262c3a', color: '#8b92a5' }}>{a.actor_role}</span>
                    <span className="text-xs" style={{ color: '#565e72' }}>{timeStr(a.created_at)}</span>
                  </div>
                  <p className="text-sm" style={{ color: '#e8eaf0' }}>{a.comment}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t" style={{ background: '#181c24', borderColor: '#2e3545' }}>
        <div className="max-w-3xl mx-auto p-3">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setIsInternal(v => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{ background: isInternal ? 'rgba(245,166,35,0.15)' : '#262c3a', color: isInternal ? '#f5a623' : '#8b92a5' }}>
              <Lock size={11} /> {isInternal ? 'Internal note' : 'Public reply'}
            </button>
            <button onClick={() => setShowStatusSheet(true)}
              className="ml-auto text-xs px-3 py-1 rounded-lg font-medium"
              style={{ background: '#4f8ef7', color: '#fff' }}>
              Update Status
            </button>
          </div>
          <div className="flex gap-2">
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder={isInternal ? 'Add internal note...' : 'Write a reply to the client...'}
              rows={2} className="flex-1 rounded-lg px-3 py-2 text-base outline-none border resize-none"
              style={{ background: '#262c3a', borderColor: isInternal ? 'rgba(245,166,35,0.3)' : '#2e3545', color: '#e8eaf0' }} />
            <button onClick={handleSend} disabled={sending || !comment.trim()}
              className="px-4 rounded-lg disabled:opacity-40"
              style={{ background: '#4f8ef7', color: '#fff', minWidth: '48px' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Status bottom sheet */}
      {showStatusSheet && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowStatusSheet(false)}>
          <div className="w-full rounded-t-2xl p-6" style={{ background: '#181c24' }} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#e8eaf0' }}>Move ticket to:</p>
            <div className="flex flex-col gap-2">
              {NEXT_STATUSES.map(s => (
                <button key={s} onClick={() => handleStatus(s)}
                  className="w-full text-left px-4 py-3 rounded-xl capitalize font-medium text-sm"
                  style={{
                    background: ticket.status === s ? 'rgba(79,142,247,0.15)' : '#262c3a',
                    color: ticket.status === s ? '#4f8ef7' : '#e8eaf0',
                  }}>
                  {s.replace(/_/g, ' ')}
                  {ticket.status === s && <span className="ml-2 text-xs" style={{ color: '#4f8ef7' }}>• current</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatusSheet(false)} className="w-full mt-3 py-3 rounded-xl text-sm"
              style={{ background: '#2e3545', color: '#8b92a5' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
