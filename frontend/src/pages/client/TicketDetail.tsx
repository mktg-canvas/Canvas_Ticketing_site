import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip } from 'lucide-react'
import { useTicket, useAddComment } from '../../hooks/useTickets'
import { StatusBadge, PriorityDot } from '../../components/tickets/StatusBadge'
import SLAChip from '../../components/tickets/SLAChip'

function timeStr(date: string) {
  return new Date(date).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function ClientTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ticket, isLoading } = useTicket(id!)
  const { mutateAsync: addComment, isPending } = useAddComment()
  const [comment, setComment] = useState('')

  async function handleComment() {
    if (!comment.trim()) return
    await addComment({ id: id!, comment, isInternal: false })
    setComment('')
  }

  if (isLoading) return (
    <div className="p-6 flex flex-col gap-3">
      {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}
    </div>
  )
  if (!ticket) return <div className="p-6 text-center" style={{ color: 'var(--color-txt2)' }}>Ticket not found.</div>

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg0)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft size={18} style={{ color: 'var(--color-txt2)' }} /></button>
        <span className="text-xs font-mono" style={{ color: 'var(--color-txt3)' }}>{ticket.ticket_number}</span>
        <StatusBadge status={ticket.status} />
        <SLAChip sla_due_at={ticket.sla_due_at} />
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-base font-semibold mb-1" style={{ color: 'var(--color-txt1)' }}>{ticket.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <PriorityDot priority={ticket.priority} />
          <span className="text-xs capitalize" style={{ color: 'var(--color-txt2)' }}>{ticket.category}</span>
          <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>{timeStr(ticket.created_at)}</span>
        </div>

        <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)' }}>
          <p className="text-sm" style={{ color: 'var(--color-txt1)' }}>{ticket.description}</p>
        </div>

        {/* Activity timeline */}
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-txt3)' }}>Activity</h2>
        <div className="flex flex-col gap-3 mb-6">
          {ticket.activities.filter((a: any) => !a.is_internal).map((a: any) => (
            <div key={a.id}>
              {a.activity_type === 'status_changed' ? (
                <div className="text-center py-2">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>
                    {a.actor.name} moved to <strong style={{ color: 'var(--color-txt1)' }}>{a.new_value?.replace('_',' ')}</strong> · {timeStr(a.created_at)}
                  </span>
                </div>
              ) : a.comment ? (
                <div className="rounded-xl p-3 border" style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-txt1)' }}>{a.actor.name}</span>
                    <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>{timeStr(a.created_at)}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-txt1)' }}>{a.comment}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed reply box */}
      {ticket.status !== 'closed' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Write a reply..." rows={2}
              className="flex-1 rounded-lg px-3 py-2 text-base outline-none border resize-none"
              style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }} />
            <button onClick={handleComment} disabled={isPending || !comment.trim()}
              className="px-4 rounded-lg disabled:opacity-40"
              style={{ background: 'var(--color-accent)', color: '#fff', minWidth: '48px' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
