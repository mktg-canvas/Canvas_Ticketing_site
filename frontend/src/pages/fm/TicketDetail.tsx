import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Lock, Building2, Layers, Briefcase, Image } from 'lucide-react'
import { useTicket, useUpdateStatus, useAddComment } from '../../hooks/useTickets'
import { StatusBadge } from '../../components/tickets/StatusBadge'

const NEXT_STATUSES = ['open', 'in_progress', 'closed']

function timeStr(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function FmTicketDetail() {
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

  if (isLoading) return (
    <div className="p-4 flex flex-col gap-3">
      {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}
    </div>
  )
  if (!ticket) return (
    <div className="p-6 text-center" style={{ color: 'var(--color-txt2)' }}>Ticket not found.</div>
  )

  return (
    <div className="min-h-screen pb-36" style={{ background: 'var(--color-bg0)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3 flex-wrap" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
        <span className="text-xs font-mono" style={{ color: 'var(--color-txt3)' }}>{ticket.ticket_number}</span>
        <StatusBadge status={ticket.status} />
        <button onClick={() => setShowStatusSheet(true)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          Update Status
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Category */}
        <h1 className="text-base font-semibold mb-1 capitalize" style={{ color: 'var(--color-txt1)' }}>
          {ticket.category.replace(/_/g, ' ')}
          {ticket.sub_category && <span className="font-normal text-sm"> — {ticket.sub_category}</span>}
        </h1>

        {/* Location row */}
        <div className="flex items-center gap-3 flex-wrap text-xs mb-4" style={{ color: 'var(--color-txt3)' }}>
          <span className="flex items-center gap-1"><Building2 size={12} />{ticket.building?.name}</span>
          <span className="flex items-center gap-1"><Layers size={12} />{ticket.floor?.name}</span>
          <span className="flex items-center gap-1"><Briefcase size={12} />{ticket.company?.name}</span>
          <span className="ml-auto text-xs">{timeStr(ticket.created_at)}</span>
        </div>

        {/* Description */}
        <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)' }}>
          <p className="text-sm" style={{ color: 'var(--color-txt1)' }}>{ticket.description}</p>
        </div>

        {/* Attachments */}
        {ticket.attachments?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {ticket.attachments.map((a: any) => (
                <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
                  className="rounded-xl overflow-hidden aspect-square border block"
                  style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)' }}>
                  {a.mime_type?.startsWith('image/') ? (
                    <img src={a.file_url} alt={a.file_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Image size={20} style={{ color: 'var(--color-txt3)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>PDF</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Activity timeline */}
        {ticket.activities?.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-txt3)' }}>Timeline</h2>
            <div className="flex flex-col gap-3 mb-4">
              {ticket.activities.map((a: any) => (
                <div key={a.id}>
                  {a.activity_type === 'status_changed' || a.activity_type === 'closed' ? (
                    <div className="text-center py-1">
                      <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>
                        {a.actor.name} → <strong style={{ color: 'var(--color-txt1)' }}>{a.new_value?.replace(/_/g, ' ')}</strong> · {timeStr(a.created_at)}
                      </span>
                    </div>
                  ) : a.comment ? (
                    <div className="rounded-xl p-3 border" style={{
                      background: a.is_internal ? 'var(--bg-warning-05)' : 'var(--color-bg2)',
                      borderColor: a.is_internal ? 'var(--color-warning)' : 'var(--color-bg4)',
                      borderLeftWidth: a.is_internal ? 3 : 1,
                    }}>
                      {a.is_internal && (
                        <p className="text-xs mb-1 font-medium" style={{ color: 'var(--color-warning)' }}>Internal note</p>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-txt1)' }}>{a.actor.name}</span>
                        <span className="text-xs capitalize px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>{a.actor.role?.replace('_', ' ')}</span>
                        <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>{timeStr(a.created_at)}</span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-txt1)' }}>{a.comment}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fixed bottom comment bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="max-w-2xl mx-auto p-3">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setIsInternal(v => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{
                background: isInternal ? 'var(--bg-warning-15)' : 'var(--color-bg3)',
                color: isInternal ? 'var(--color-warning)' : 'var(--color-txt2)',
              }}>
              <Lock size={11} /> {isInternal ? 'Internal note' : 'Comment'}
            </button>
          </div>
          <div className="flex gap-2">
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder={isInternal ? 'Add internal note...' : 'Add a comment...'}
              rows={2}
              className="flex-1 rounded-lg px-3 py-2 text-base outline-none border resize-none"
              style={{
                background: 'var(--color-bg3)',
                borderColor: isInternal ? 'var(--color-warning)' : 'var(--color-bg4)',
                color: 'var(--color-txt1)',
              }} />
            <button onClick={handleSend} disabled={sending || !comment.trim()}
              className="px-4 rounded-lg disabled:opacity-40"
              style={{ background: 'var(--color-accent)', color: '#fff', minWidth: '48px' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Status bottom sheet */}
      {showStatusSheet && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowStatusSheet(false)}>
          <div className="w-full rounded-t-2xl p-6" style={{ background: 'var(--color-bg1)' }}
            onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-txt1)' }}>Move ticket to:</p>
            <div className="flex flex-col gap-2">
              {NEXT_STATUSES.map(s => (
                <button key={s} onClick={() => handleStatus(s)}
                  className="w-full text-left px-4 py-3.5 rounded-xl capitalize font-medium text-sm"
                  style={{
                    background: ticket.status === s ? 'var(--bg-accent-15)' : 'var(--color-bg3)',
                    color: ticket.status === s ? 'var(--color-accent)' : 'var(--color-txt1)',
                    border: `1.5px solid ${ticket.status === s ? 'var(--color-accent)' : 'transparent'}`,
                  }}>
                  {s.replace(/_/g, ' ')}
                  {ticket.status === s && <span className="ml-2 text-xs" style={{ color: 'var(--color-accent)' }}>• current</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowStatusSheet(false)}
              className="w-full mt-3 py-3 rounded-xl text-sm"
              style={{ background: 'var(--color-bg4)', color: 'var(--color-txt2)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
