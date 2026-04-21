import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Layers, Briefcase, User, Clock, FileText, Image as ImageIcon, CheckCircle, MapPin } from 'lucide-react'
import { useTicket, useUpdateStatus } from '../../hooks/useTickets'
import { StatusBadge } from '../../components/tickets/StatusBadge'

const NEXT_STATUSES = ['open', 'in_progress', 'closed'] as const

const STATUS_META = {
  open:        { label: 'Opened',      color: 'var(--color-danger)',  bg: 'var(--bg-danger-10)' },
  in_progress: { label: 'In Progress', color: 'var(--color-warning)', bg: 'var(--bg-warning-15)' },
  closed:      { label: 'Closed',      color: 'var(--color-success)', bg: 'var(--bg-success-15)' },
}

function fmt(d?: string | null) {
  if (!d) return null
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function FmTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: ticket, isLoading } = useTicket(id!)
  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdateStatus()
  const [showStatusSheet, setShowStatusSheet] = useState(false)

  async function handleStatus(newStatus: string) {
    await updateStatus({ id: id!, status: newStatus })
    setShowStatusSheet(false)
  }

  if (isLoading) return (
    <div className="min-h-screen p-4 flex flex-col gap-3" style={{ background: 'var(--color-bg0)' }}>
      {[180, 120, 160, 100].map((h, i) => (
        <div key={i} className="rounded-2xl animate-pulse" style={{ background: 'var(--color-bg2)', height: h }} />
      ))}
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg0)', color: 'var(--color-txt2)' }}>
      Ticket not found.
    </div>
  )

  const categoryName = typeof ticket.category === 'string'
    ? ticket.category.replace(/_/g, ' ')
    : (ticket.category as any)?.name ?? ''

  const timelineSteps = [
    { key: 'open',        ts: ticket.opened_at },
    { key: 'in_progress', ts: ticket.in_progress_at },
    { key: 'closed',      ts: ticket.closed_at },
  ] as const

  const currentStepIdx = timelineSteps.map(s => !!s.ts).lastIndexOf(true)

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--color-bg0)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate(-1)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-bg3)]">
          <ArrowLeft size={18} style={{ color: 'var(--color-txt2)' }} />
        </button>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>
          {ticket.ticket_number}
        </span>
        <StatusBadge status={ticket.status} />
        <button
          onClick={() => setShowStatusSheet(true)}
          className="ml-auto px-4 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Update Status
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">

        {/* Hero card */}
        <div className="rounded-2xl p-5 border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-accent)' }}>
            {categoryName}
          </p>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-txt1)' }}>
            {ticket.sub_category || categoryName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-bg4)' }}>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-txt3)' }}>
              <MapPin size={11} /> {ticket.building?.name}
              {ticket.floor?.name && <> · {ticket.floor.name}</>}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-txt3)' }}>
              <Briefcase size={11} /> {ticket.company?.name}
            </span>
            <span className="ml-auto text-xs" style={{ color: 'var(--color-txt3)' }}>
              {fmt(ticket.created_at)}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--color-txt3)' }}>Details</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Building2, label: 'Building', value: ticket.building?.name },
              { icon: Layers,    label: 'Floor',    value: ticket.floor?.name },
              { icon: Briefcase, label: 'Company',  value: ticket.company?.name },
              { icon: User,      label: 'Raised by', value: (ticket as any).raiser?.name },
            ].filter(d => d.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl p-3.5 border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} style={{ color: 'var(--color-txt3)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>{label}</p>
                </div>
                <p className="text-sm font-semibold break-words" style={{ color: 'var(--color-txt1)' }}>{value}</p>
              </div>
            ))}
          </div>
          {/* Created — full width */}
          <div className="mt-2 rounded-xl p-3.5 border flex items-center gap-3" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            <Clock size={13} style={{ color: 'var(--color-txt3)' }} />
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--color-txt3)' }}>Created</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{fmt(ticket.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--color-txt3)' }}>Description</p>
          <div className="rounded-2xl border p-4" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-bg3)' }}>
                <FileText size={14} style={{ color: 'var(--color-txt3)' }} />
              </div>
              {ticket.description
                ? <p className="text-sm leading-relaxed pt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--color-txt1)' }}>{ticket.description}</p>
                : <p className="text-sm pt-1 italic" style={{ color: 'var(--color-txt3)' }}>No description provided.</p>
              }
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--color-txt3)' }}>Status Timeline</p>
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            {timelineSteps.map((step, i) => {
              const meta = STATUS_META[step.key]
              const done = !!step.ts
              const isLast = i === timelineSteps.length - 1
              return (
                <div key={step.key} className="relative flex items-start gap-4 px-4 py-4">
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className="absolute left-[27px] top-12 bottom-0 w-0.5"
                      style={{ background: done ? meta.color : 'var(--color-bg4)', opacity: done ? 0.3 : 1 }}
                    />
                  )}

                  {/* Step dot */}
                  <div
                    className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: done ? meta.bg : 'var(--color-bg3)',
                      border: `2px solid ${done ? meta.color : 'var(--color-bg4)'}`,
                    }}
                  >
                    {done
                      ? <CheckCircle size={13} style={{ color: meta.color }} />
                      : <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-bg4)' }} />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-1" style={{ opacity: done ? 1 : 0.4 }}>
                    <p className="text-sm font-bold" style={{ color: done ? 'var(--color-txt1)' : 'var(--color-txt3)' }}>
                      {meta.label}
                    </p>
                    {done
                      ? <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>{fmt(step.ts)}</p>
                      : <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>Not yet reached</p>
                    }
                  </div>

                  {/* Active indicator */}
                  {i === currentStepIdx && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full self-center" style={{ background: meta.bg, color: meta.color }}>
                      Current
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Photos */}
        {(ticket as any).attachments?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--color-txt3)' }}>
              Photos · {(ticket as any).attachments.length}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(ticket as any).attachments.map((a: any) => (
                <a
                  key={a.id}
                  href={a.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl overflow-hidden aspect-square border block transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)' }}
                >
                  {a.mime_type?.startsWith('image/') ? (
                    <img src={a.file_url} alt={a.file_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <ImageIcon size={20} style={{ color: 'var(--color-txt3)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>PDF</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status bottom sheet */}
      {showStatusSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'var(--bg-overlay-60)' }}
          onClick={() => setShowStatusSheet(false)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl p-6"
            style={{ background: 'var(--color-bg1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--color-bg4)' }} />
            <p className="text-base font-bold mb-4" style={{ color: 'var(--color-txt1)' }}>Update Status</p>
            <div className="flex flex-col gap-2.5">
              {NEXT_STATUSES.map(s => {
                const meta = STATUS_META[s]
                const isCurrent = ticket.status === s
                return (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
                    style={{
                      background: isCurrent ? meta.bg : 'var(--color-bg3)',
                      color: isCurrent ? meta.color : 'var(--color-txt1)',
                      border: `1.5px solid ${isCurrent ? meta.color : 'transparent'}`,
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />
                    {meta.label}
                    {isCurrent && <span className="ml-auto text-xs font-normal opacity-70">· current</span>}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setShowStatusSheet(false)}
              className="w-full mt-3 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
