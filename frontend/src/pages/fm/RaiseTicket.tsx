import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, X } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useBuildings } from '../../hooks/useBuildings'
import { useFloors } from '../../hooks/useFloors'
import { useCompanies } from '../../hooks/useCompanies'
import { useCategories } from '../../hooks/useCategories'
import { useCreateTicket } from '../../hooks/useTickets'

const FLOOR_ORDER = ['Ground Floor','1st Floor','2nd Floor','3rd Floor','4th Floor','Terrace','Basement','Common Area']

const inputCls = 'w-full rounded-xl px-4 py-3 text-base outline-none border transition-colors'
const inputStyle = { background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }

export default function RaiseTicket() {
  const navigate = useNavigate()
  const { mutateAsync: createTicket, isPending } = useCreateTicket()
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [categoryId, setCategoryId] = useState('')
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

  const canSubmit = buildingId && floorId && companyId && categoryId && description.trim().length >= 5

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      fd.append('buildingId', buildingId)
      fd.append('floorId', floorId)
      fd.append('companyId', companyId)
      fd.append('categoryId', categoryId)
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

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg0)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>Raise New Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-5">

        {/* Building */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Building *</label>
          <select value={buildingId} onChange={e => handleBuildingChange(e.target.value)}
            className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}>
            <option value=''>Select building</option>
            {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Floor */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Floor *</label>
          <select value={floorId} onChange={e => setFloorId(e.target.value)}
            disabled={!buildingId}
            className={inputCls} style={{ ...inputStyle, opacity: buildingId ? 1 : 0.5 }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}>
            <option value=''>Select floor</option>
            {floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Company */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Company *</label>
          <select value={companyId} onChange={e => setCompanyId(e.target.value)}
            className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}>
            <option value=''>Select company</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Issue Category *</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}>
            <option value=''>Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sub-category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Sub-category <span style={{ color: 'var(--color-txt3)', fontWeight: 400 }}>(optional)</span></label>
          <input value={subCategory} onChange={e => setSubCategory(e.target.value)}
            placeholder="e.g. socket not working, pipe leaking"
            className={inputCls} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')} />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className={`${inputCls} resize-none`} style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')} />
        </div>

        {/* Photos */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Photos <span style={{ color: 'var(--color-txt3)', fontWeight: 400 }}>(up to 5)</span></label>
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
              className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm"
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

        <button type="submit" disabled={isPending || !canSubmit}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '52px' }}>
          {isPending ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}
