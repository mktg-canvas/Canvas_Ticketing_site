import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, X, ChevronDown } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useBuildings } from '../../hooks/useBuildings'
import { useFloors } from '../../hooks/useFloors'
import { useCompanies } from '../../hooks/useCompanies'
import { useCategories } from '../../hooks/useCategories'
import { useCreateTicket } from '../../hooks/useTickets'

const FLOOR_ORDER = ['Ground Floor','1st Floor','2nd Floor','3rd Floor','4th Floor','Terrace','Basement','Common Area']

const STATUSES = [
  { value: 'open',        label: 'Open',        color: 'var(--color-danger)' },
  { value: 'in_progress', label: 'In Progress',  color: 'var(--color-warning)' },
  { value: 'closed',      label: 'Closed',       color: 'var(--color-success)' },
] as const

type StatusValue = 'open' | 'in_progress' | 'closed'

function Label({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-txt3)' }}>
      {text}
      {optional && <span className="normal-case font-normal tracking-normal text-xs" style={{ color: 'var(--color-txt3)' }}>(optional)</span>}
    </label>
  )
}

function SelectField({
  label, required, disabled, value, onChange, placeholder, children,
}: {
  label: string; required?: boolean; disabled?: boolean
  value: string; onChange: (v: string) => void
  placeholder: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label text={required ? `${label} *` : label} />
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl px-4 text-sm outline-none border"
          style={{
            background: 'var(--color-bg1)',
            borderColor: 'var(--color-bg4)',
            color: value ? 'var(--color-txt1)' : 'var(--color-txt3)',
            opacity: disabled ? 0.5 : 1,
            height: 52,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
        >
          <option value=''>{placeholder}</option>
          {children}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-txt3)' }}
        />
      </div>
    </div>
  )
}

function StatusField({ value, onChange }: { value: StatusValue; onChange: (v: StatusValue) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = STATUSES.find(s => s.value === value)!

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <Label text="Status" />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-3 rounded-xl px-4 text-sm border text-left"
          style={{
            background: 'var(--color-bg1)',
            borderColor: open ? 'var(--color-accent)' : 'var(--color-bg4)',
            color: 'var(--color-txt1)',
            height: 52,
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: current.color }} />
          <span className="flex-1">{current.label}</span>
          <ChevronDown
            size={16}
            style={{
              color: 'var(--color-txt3)',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {open && (
          <div
            className="absolute left-0 right-0 z-20 mt-1 rounded-xl border overflow-hidden shadow-lg"
            style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}
          >
            {STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => { onChange(s.value); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
                style={{
                  background: value === s.value ? 'var(--color-bg3)' : 'transparent',
                  color: value === s.value ? 'var(--color-txt1)' : 'var(--color-txt2)',
                }}
                onMouseEnter={e => { if (value !== s.value) e.currentTarget.style.background = 'var(--color-bg2)' }}
                onMouseLeave={e => { if (value !== s.value) e.currentTarget.style.background = 'transparent' }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RaiseTicket() {
  const navigate = useNavigate()
  const { mutateAsync: createTicket, isPending } = useCreateTicket()
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<StatusValue>('open')
  const [subCategory, setSubCategory] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])

  const { data: categories = [] } = useCategories()
  const { data: buildings = [] } = useBuildings()
  const { data: rawFloors = [] } = useFloors(buildingId || undefined)
  const floors = [...rawFloors].sort((a: any, b: any) => {
    const ai = FLOOR_ORDER.indexOf(a.name)
    const bi = FLOOR_ORDER.indexOf(b.name)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  const { data: companies = [] } = useCompanies(buildingId || undefined)

  function handleBuildingChange(id: string) {
    setBuildingId(id)
    setFloorId('')
    setCompanyId('')
  }

  function addPhotos(files: FileList | null) {
    if (!files) return
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
    setPhotos(prev => [...prev, ...allowed].slice(0, 5))
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  const canSubmit = buildingId && floorId && companyId && categoryId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      fd.append('buildingId', buildingId)
      fd.append('floorId', floorId)
      fd.append('companyId', companyId)
      fd.append('categoryId', categoryId)
      fd.append('status', status)
      if (subCategory.trim()) fd.append('subCategory', subCategory.trim())
      fd.append('description', description.trim())
      photos.forEach(f => fd.append('files', f))

      const ticket = await createTicket(fd)
      navigate(`/fm/tickets/${ticket.id}`)
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const e = err.response?.data?.error
        setError(typeof e === 'object' ? Object.values(e).flat().join(', ') : e || 'Failed to create ticket')
      } else {
        setError('Failed to create ticket')
      }
    }
  }

  const textFieldStyle = {
    background: 'var(--color-bg1)',
    borderColor: 'var(--color-bg4)',
    color: 'var(--color-txt1)',
  }
  const textFieldCls = 'w-full rounded-xl px-4 py-3.5 text-sm outline-none border'

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg0)' }}>
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>Raise New Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-5">

        <SelectField label="Building" required value={buildingId} onChange={handleBuildingChange} placeholder="Select building">
          {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </SelectField>

        <SelectField label="Floor" required disabled={!buildingId} value={floorId} onChange={setFloorId} placeholder="Select floor">
          {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </SelectField>

        <SelectField label="Company" required value={companyId} onChange={setCompanyId} placeholder="Select company">
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>

        <SelectField label="Issue Category" required value={categoryId} onChange={setCategoryId} placeholder="Select category">
          {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </SelectField>

        <StatusField value={status} onChange={setStatus} />

        {/* Sub-category */}
        <div className="flex flex-col gap-1.5">
          <Label text="Sub-category" optional />
          <input
            value={subCategory}
            onChange={e => setSubCategory(e.target.value)}
            placeholder="e.g. socket not working, pipe leaking"
            className={textFieldCls}
            style={textFieldStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label text="Description" optional />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className={`${textFieldCls} resize-none`}
            style={textFieldStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
          />
        </div>

        {/* Photos */}
        <div className="flex flex-col gap-1.5">
          <Label text="Photos" optional />
          <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden"
            onChange={e => addPhotos(e.target.files)} />

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {photos.map((f, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-square"
                  style={{ background: 'var(--color-bg3)' }}>
                  {f.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--color-txt2)' }}>PDF</div>
                  )}
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <X size={10} color="white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed text-sm"
              style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)' }}>
              <Camera size={18} /> Add photos
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="w-full py-4 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '52px' }}
        >
          {isPending ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}
