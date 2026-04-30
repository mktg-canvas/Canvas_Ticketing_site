import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Layers, Briefcase, User, Clock, FileText, Image as ImageIcon, CheckCircle, MapPin, Pencil, Trash2, ChevronDown, Camera, Plus } from 'lucide-react'
import { useTicket, useUpdateStatus, useEditTicket, useDeleteTicket, useUploadAttachment } from '../../hooks/useTickets'
import { useBuildings } from '../../hooks/useBuildings'
import { useFloors } from '../../hooks/useFloors'
import { useCompanies } from '../../hooks/useCompanies'
import { useCategories } from '../../hooks/useCategories'
import { useAuthStore } from '../../store/authStore'
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

function EditSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: 'var(--color-txt3)' }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-3 pr-8 text-sm outline-none border"
          style={{
            background: 'var(--color-bg2)',
            borderColor: 'var(--color-bg4)',
            color: 'var(--color-txt1)',
            height: 44,
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
        >
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-txt3)' }} />
      </div>
    </div>
  )
}

export default function FmTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'super_admin'

  const { data: ticket, isLoading } = useTicket(id!)
  const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdateStatus()
  const { mutateAsync: editTicket, isPending: editing } = useEditTicket()
  const { mutateAsync: deleteTicket, isPending: deleting } = useDeleteTicket()
  const { mutateAsync: uploadAttachment, isPending: uploading } = useUploadAttachment()
  const stageFileRef = useRef<HTMLInputElement>(null)
  const [uploadingStage, setUploadingStage] = useState<string | null>(null)

  const { data: buildings = [] } = useBuildings()
  const [editBuildingId, setEditBuildingId] = useState('')
  const { data: floors = [] } = useFloors(editBuildingId || undefined)
  const { data: companies = [] } = useCompanies()
  const { data: categories = [] } = useCategories()

  const [showStatusSheet, setShowStatusSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editForm, setEditForm] = useState({
    buildingId: '', floorId: '', companyId: '',
    categoryId: '', subCategory: '', description: '',
    source: 'client' as 'client' | 'fm',
  })

  function openEditSheet() {
    if (!ticket) return
    const catId = typeof ticket.category === 'string' ? '' : (ticket.category as any)?.id ?? ''
    const bid = ticket.building_id
    setEditBuildingId(bid)
    setEditForm({
      buildingId: bid,
      floorId: ticket.floor_id,
      companyId: ticket.company_id,
      categoryId: catId,
      subCategory: ticket.sub_category ?? '',
      description: ticket.description ?? '',
      source: ticket.source ?? 'client',
    })
    setShowEditSheet(true)
  }

  function handleEditBuildingChange(buildingId: string) {
    setEditBuildingId(buildingId)
    setEditForm(f => ({ ...f, buildingId, floorId: '' }))
  }

  async function handleStatus(newStatus: string) {
    await updateStatus({ id: id!, status: newStatus })
    setShowStatusSheet(false)
  }

  async function handleEdit() {
    await editTicket({
      id: id!,
      buildingId: editForm.buildingId || undefined,
      floorId: editForm.floorId || undefined,
      companyId: editForm.companyId || undefined,
      categoryId: editForm.categoryId || undefined,
      subCategory: editForm.subCategory || undefined,
      description: editForm.description,
      source: editForm.source,
    })
    setShowEditSheet(false)
  }

  async function handleDelete() {
    await deleteTicket(id!)
    navigate(-1)
  }

  function openStageUpload(stage: string) {
    setUploadingStage(stage)
    stageFileRef.current?.click()
  }

  async function handleStageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !uploadingStage) return
    for (const file of files) {
      await uploadAttachment({ id: id!, file, stage: uploadingStage })
    }
    e.target.value = ''
    setUploadingStage(null)
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

  const STATUS_ORDER: Record<string, number> = { open: 0, in_progress: 1, closed: 2 }
  const currentStepIdx = STATUS_ORDER[ticket.status] ?? 0

  const timelineSteps = [
    { key: 'open',        ts: ticket.opened_at },
    { key: 'in_progress', ts: ticket.in_progress_at },
    { key: 'closed',      ts: ticket.closed_at },
  ] as const

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--color-bg0)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-2 border-b" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate(-1)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-bg3)]">
          <ArrowLeft size={18} style={{ color: 'var(--color-txt2)' }} />
        </button>
        <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg truncate max-w-[100px]" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>
          {ticket.ticket_number}
        </span>
        <StatusBadge status={ticket.status} />

        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={openEditSheet}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-bg3)]"
                title="Edit ticket"
              >
                <Pencil size={16} style={{ color: 'var(--color-txt2)' }} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--color-danger)' }}
                title="Delete ticket"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowStatusSheet(true)}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            Update Status
          </button>
        </div>
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
            <span
              className="text-xs px-2 py-0.5 rounded-md font-semibold"
              style={ticket.source === 'fm'
                ? { background: 'var(--bg-accent-15)', color: 'var(--color-accent)' }
                : { background: 'var(--bg-warning-15)', color: 'var(--color-warning)' }
              }
            >
              {ticket.source === 'fm' ? 'FM Observed' : 'Client Reported'}
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
              { icon: Building2, label: 'Building',   value: ticket.building?.name },
              { icon: Layers,    label: 'Floor',       value: ticket.floor?.name },
              { icon: Briefcase, label: 'Company',     value: ticket.company?.name },
              { icon: User,      label: 'Raised by',   value: (ticket as any).raiser?.name },
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
              const done = i <= currentStepIdx
              const isLast = i === timelineSteps.length - 1
              return (
                <div key={step.key} className="relative flex items-start gap-4 px-4 py-4">
                  {!isLast && (
                    <div
                      className="absolute left-[27px] top-12 bottom-0 w-0.5"
                      style={{ background: done ? meta.color : 'var(--color-bg4)', opacity: done ? 0.3 : 1 }}
                    />
                  )}
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
                  <div className="flex-1 pb-1" style={{ opacity: done ? 1 : 0.4 }}>
                    <p className="text-sm font-bold" style={{ color: done ? 'var(--color-txt1)' : 'var(--color-txt3)' }}>
                      {meta.label}
                    </p>
                    {done
                      ? <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>{fmt(step.ts) ?? '—'}</p>
                      : <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>Not yet reached</p>
                    }
                  </div>
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

        {/* Hidden file input for stage photo uploads */}
        <input
          ref={stageFileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleStageFileChange}
        />

        {/* Initial Photos (raised with ticket) */}
        {(() => {
          const initial = (ticket as any).attachments?.filter((a: any) => !a.stage) ?? []
          if (!initial.length) return null
          return (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--color-txt3)' }}>
                Photos · {initial.length}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {initial.map((a: any) => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
                    className="rounded-xl overflow-hidden aspect-square border block transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)' }}>
                    {a.mime_type?.startsWith('image/')
                      ? <img src={a.file_url} alt={a.file_name || ''} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <ImageIcon size={20} style={{ color: 'var(--color-txt3)' }} />
                          <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>PDF</span>
                        </div>
                    }
                  </a>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Progress Photos */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--color-txt3)' }}>
            Progress Photos
          </p>
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            {([
              { key: 'open',        label: 'Opened',      ts: ticket.opened_at,      meta: STATUS_META.open },
              { key: 'in_progress', label: 'In Progress', ts: ticket.in_progress_at, meta: STATUS_META.in_progress },
              { key: 'closed',      label: 'Closed',      ts: ticket.closed_at,      meta: STATUS_META.closed },
            ] as const).map(({ key, label, ts, meta }, i) => {
              const stagePhotos: any[] = (ticket as any).attachments?.filter((a: any) => a.stage === key) ?? []
              const isUploading = uploading && uploadingStage === key
              return (
                <div key={key} className={i > 0 ? 'border-t' : ''} style={{ borderColor: 'var(--color-bg4)' }}>
                  <div className="px-4 pt-4 pb-3">
                    {/* Stage header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: ts ? meta.color : 'var(--color-bg4)' }} />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>
                          {label}
                        </p>
                        {stagePhotos.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                            style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)' }}>
                            {stagePhotos.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {ts && <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>{fmt(ts)}</span>}
                        <button
                          onClick={() => openStageUpload(key)}
                          disabled={isUploading}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity"
                          style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
                        >
                          {isUploading
                            ? <span className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-txt2)', borderTopColor: 'transparent' }} />
                            : <><Camera size={12} /><span>Add Photo</span></>
                          }
                        </button>
                      </div>
                    </div>

                    {/* Photos grid */}
                    {stagePhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {stagePhotos.map((a: any) => (
                          <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
                            className="rounded-xl overflow-hidden aspect-square border block transition-opacity hover:opacity-90"
                            style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)' }}>
                            {a.mime_type?.startsWith('image/')
                              ? <img src={a.file_url} alt={a.file_name || ''} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                  <ImageIcon size={16} style={{ color: 'var(--color-txt3)' }} />
                                  <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>File</span>
                                </div>
                            }
                          </a>
                        ))}
                        <button onClick={() => openStageUpload(key)} disabled={isUploading}
                          className="rounded-xl aspect-square border-2 border-dashed flex items-center justify-center transition-opacity disabled:opacity-50"
                          style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt3)' }}>
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => openStageUpload(key)} disabled={isUploading}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed text-sm transition-opacity disabled:opacity-50"
                        style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt3)' }}>
                        <Camera size={16} />
                        Add {label} photos
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Status bottom sheet ── */}
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
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50"
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

      {/* ── Edit bottom sheet (super admin only) ── */}
      {showEditSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'var(--bg-overlay-60)' }}
          onClick={() => setShowEditSheet(false)}
        >
          <div
            className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
            style={{ background: 'var(--color-bg1)', maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--color-bg4)' }} />
              <p className="text-base font-bold" style={{ color: 'var(--color-txt1)' }}>Edit Ticket</p>
            </div>

            {/* Scrollable fields */}
            <div className="overflow-y-auto px-6 pb-4 flex flex-col gap-4">
              <EditSelect
                label="Building"
                value={editForm.buildingId}
                onChange={handleEditBuildingChange}
              >
                <option value="">Select building</option>
                {(buildings as any[]).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </EditSelect>

              <EditSelect
                label="Floor"
                value={editForm.floorId}
                onChange={v => setEditForm(f => ({ ...f, floorId: v }))}
              >
                <option value="">Select floor</option>
                {(floors as any[]).map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </EditSelect>

              <EditSelect
                label="Company"
                value={editForm.companyId}
                onChange={v => setEditForm(f => ({ ...f, companyId: v }))}
              >
                <option value="">Select company</option>
                {(companies as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </EditSelect>

              <EditSelect
                label="Category"
                value={editForm.categoryId}
                onChange={v => setEditForm(f => ({ ...f, categoryId: v }))}
              >
                <option value="">Select category</option>
                {(categories as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </EditSelect>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-txt3)' }}>Sub-category</label>
                <input
                  type="text"
                  value={editForm.subCategory}
                  onChange={e => setEditForm(f => ({ ...f, subCategory: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-xl px-3 text-sm outline-none border"
                  style={{
                    background: 'var(--color-bg2)',
                    borderColor: 'var(--color-bg4)',
                    color: 'var(--color-txt1)',
                    height: 44,
                    fontSize: 16,
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-txt3)' }}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                  rows={4}
                  className="w-full rounded-xl px-3 py-3 text-sm outline-none border resize-none"
                  style={{
                    background: 'var(--color-bg2)',
                    borderColor: 'var(--color-bg4)',
                    color: 'var(--color-txt1)',
                    fontSize: 16,
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-txt3)' }}>Ticket Source</label>
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-bg4)' }}>
                  {(['client', 'fm'] as const).map(val => {
                    const active = editForm.source === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, source: val }))}
                        className="flex-1 py-3 text-sm font-semibold transition-colors"
                        style={{
                          background: active ? 'var(--color-accent)' : 'var(--color-bg2)',
                          color: active ? '#fff' : 'var(--color-txt3)',
                        }}
                      >
                        {val === 'client' ? 'Client Reported' : 'FM Observed'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sheet footer */}
            <div className="px-6 pt-3 pb-6 shrink-0 flex flex-col gap-2.5 border-t" style={{ borderColor: 'var(--color-bg4)' }}>
              <button
                onClick={handleEdit}
                disabled={editing}
                className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                {editing ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditSheet(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation (super admin only) ── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'var(--bg-overlay-60)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: 'var(--color-bg1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-danger-10)' }}>
              <Trash2 size={22} style={{ color: 'var(--color-danger)' }} />
            </div>
            <p className="text-base font-bold text-center mb-1" style={{ color: 'var(--color-txt1)' }}>Delete Ticket?</p>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--color-txt3)' }}>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-txt2)' }}>{ticket.ticket_number}</span> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-danger)', color: '#fff' }}
              >
                {deleting ? 'Deleting…' : 'Delete Ticket'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
