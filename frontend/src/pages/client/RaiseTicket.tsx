import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Paperclip, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { useCreateTicket } from '../../hooks/useTickets'

const CATEGORIES = ['hvac','electrical','plumbing','internet','housekeeping','furniture','security','access','billing','other']
const PRIORITIES = ['low','medium','high']

interface Form { title: string; description: string; category: string; priority: string }

export default function RaiseTicket() {
  const navigate = useNavigate()
  const { mutateAsync, isPending } = useCreateTicket()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ defaultValues: { priority: 'medium', category: 'hvac' } })
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  async function onSubmit(data: Form) {
    setError('')
    const fd = new FormData()
    fd.append('title', data.title)
    fd.append('description', data.description)
    fd.append('category', data.category)
    fd.append('priority', data.priority)
    files.forEach(f => fd.append('files', f))
    try {
      await mutateAsync(fd)
      navigate('/client/tickets')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to raise ticket')
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const arr = Array.from(fileList).slice(0, 5 - files.length)
    setFiles(prev => [...prev, ...arr])
  }

  const inputStyle = { background: '#262c3a', borderColor: '#2e3545', color: '#e8eaf0' }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto" style={{ background: '#0f1117' }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-6" style={{ color: '#8b92a5' }}>
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-base font-semibold mb-1" style={{ color: '#e8eaf0' }}>Raise a Ticket</h1>
      <p className="text-xs mb-6" style={{ color: '#8b92a5' }}>Describe your issue and our team will respond promptly.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Title *</label>
          <input {...register('title', { required: 'Title is required' })} placeholder="Brief subject of the issue"
            className="rounded-lg px-3 py-2.5 text-base outline-none border"
            style={{ ...inputStyle, borderColor: errors.title ? '#f05252' : '#2e3545' }}
            onFocus={e => e.target.style.borderColor = '#4f8ef7'}
            onBlur={e => e.target.style.borderColor = errors.title ? '#f05252' : '#2e3545'} />
          {errors.title && <p className="text-xs" style={{ color: '#f05252' }}>{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Category</label>
            <select {...register('category')} className="rounded-lg px-3 py-2.5 text-base outline-none border capitalize"
              style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Priority</label>
            <select {...register('priority')} className="rounded-lg px-3 py-2.5 text-base outline-none border"
              style={inputStyle}>
              {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Description *</label>
          <textarea {...register('description', { required: 'Description required', minLength: { value: 20, message: 'At least 20 characters' } })}
            placeholder="Describe the issue in detail..." rows={5}
            className="rounded-lg px-3 py-2.5 text-base outline-none border resize-none"
            style={{ ...inputStyle, borderColor: errors.description ? '#f05252' : '#2e3545' }}
            onFocus={e => e.target.style.borderColor = '#4f8ef7'}
            onBlur={e => e.target.style.borderColor = errors.description ? '#f05252' : '#2e3545'} />
          {errors.description && <p className="text-xs" style={{ color: '#f05252' }}>{errors.description.message}</p>}
        </div>

        {/* Attachments */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Attachments (optional, max 5)</label>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => addFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm"
            style={{ background: '#262c3a', borderColor: '#2e3545', color: '#8b92a5' }}>
            <Paperclip size={15} /> Attach files
          </button>
          {files.length > 0 && (
            <div className="flex flex-col gap-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                  style={{ background: '#262c3a' }}>
                  <span className="text-xs truncate" style={{ color: '#e8eaf0' }}>{f.name}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                    <X size={14} style={{ color: '#565e72' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(240,82,82,0.1)', color: '#f05252' }}>{error}</p>}

        <button type="submit" disabled={isPending}
          className="w-full rounded-lg py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: '#4f8ef7', color: '#fff', minHeight: '48px' }}>
          {isPending ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}
