import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Paperclip, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { isAxiosError } from 'axios'
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
    } catch (e: unknown) {
      setError(isAxiosError(e) ? e.response?.data?.error || 'Failed to raise ticket' : 'Failed to raise ticket')
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const arr = Array.from(fileList).slice(0, 5 - files.length)
    setFiles(prev => [...prev, ...arr])
  }

  const inputStyle = { background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto" style={{ background: 'var(--color-bg0)' }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--color-txt2)' }}>
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-base font-semibold mb-1" style={{ color: 'var(--color-txt1)' }}>Raise a Ticket</h1>
      <p className="text-xs mb-6" style={{ color: 'var(--color-txt2)' }}>Describe your issue and our team will respond promptly.</p>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault() }} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Title *</label>
          <input {...register('title', { required: 'Title is required' })} placeholder="Brief subject of the issue"
            className="rounded-lg px-3 py-2.5 text-base outline-none border"
            style={{ ...inputStyle, borderColor: errors.title ? 'var(--color-danger)' : 'var(--color-bg4)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = errors.title ? 'var(--color-danger)' : 'var(--color-bg4)'} />
          {errors.title && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Category</label>
            <select {...register('category')} className="rounded-lg px-3 py-2.5 text-base outline-none border capitalize"
              style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Priority</label>
            <select {...register('priority')} className="rounded-lg px-3 py-2.5 text-base outline-none border"
              style={inputStyle}>
              {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Description *</label>
          <textarea {...register('description', { required: 'Description required', minLength: { value: 20, message: 'At least 20 characters' } })}
            placeholder="Describe the issue in detail..." rows={5}
            className="rounded-lg px-3 py-2.5 text-base outline-none border resize-none"
            style={{ ...inputStyle, borderColor: errors.description ? 'var(--color-danger)' : 'var(--color-bg4)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = errors.description ? 'var(--color-danger)' : 'var(--color-bg4)'} />
          {errors.description && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.description.message}</p>}
        </div>

        {/* Attachments */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Attachments (optional, max 5)</label>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => addFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm"
            style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)' }}>
            <Paperclip size={15} /> Attach files
          </button>
          {files.length > 0 && (
            <div className="flex flex-col gap-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--color-bg3)' }}>
                  <span className="text-xs truncate" style={{ color: 'var(--color-txt1)' }}>{f.name}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                    <X size={14} style={{ color: 'var(--color-txt3)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={isPending}
          className="w-full rounded-lg py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '48px' }}>
          {isPending ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}
