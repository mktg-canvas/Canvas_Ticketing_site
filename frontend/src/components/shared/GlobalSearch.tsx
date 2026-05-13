import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const role = useAuthStore(s => s.user?.role)
  const linkPrefix = role === 'super_admin' ? '/admin/tickets' : '/cem/tickets'

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setDebounced('') }
  }, [open])

  // Escape closes; Cmd/Ctrl+K opens
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const { data: tickets = [], isFetching } = useQuery<any[]>({
    queryKey: ['ticket-search', debounced],
    queryFn: async () => {
      const res = await api.get(`/tickets?q=${encodeURIComponent(debounced)}`)
      return res.data.tickets
    },
    enabled: debounced.length >= 1,
    staleTime: 10_000,
  })

  function go(id: string) {
    navigate(`${linkPrefix}/${id}`)
    setOpen(false)
  }

  const STATUS_COLOR: Record<string, string> = {
    open:        'var(--color-danger)',
    in_progress: 'var(--color-warning)',
    closed:      'var(--color-success)',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search tickets (⌘K)"
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-full border text-xs font-semibold transition-colors"
        style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)', background: 'transparent' }}
      >
        <Search size={14} />
        <span className="hidden lg:inline" style={{ color: 'var(--color-txt3)' }}>Search</span>
        <kbd className="hidden lg:inline px-1 rounded text-[10px]"
          style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)' }}>⌘K</kbd>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-xl rounded-2xl border overflow-hidden shadow-2xl"
            style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--color-bg4)' }}>
              <Search size={16} style={{ color: 'var(--color-txt3)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by ticket ID…"
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--color-txt1)' }}
              />
              {query ? (
                <button onClick={() => setQuery('')} className="shrink-0">
                  <X size={15} style={{ color: 'var(--color-txt3)' }} />
                </button>
              ) : (
                <button onClick={() => setOpen(false)} className="shrink-0">
                  <X size={15} style={{ color: 'var(--color-txt3)' }} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {debounced.length < 1 ? (
                <p className="text-xs text-center py-10" style={{ color: 'var(--color-txt3)' }}>
                  Enter a ticket number to search
                </p>
              ) : isFetching ? (
                <div className="flex flex-col gap-1 p-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--color-bg2)' }} />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <p className="text-xs text-center py-10" style={{ color: 'var(--color-txt3)' }}>
                  No tickets found for &ldquo;{debounced}&rdquo;
                </p>
              ) : (
                <div className="p-2 flex flex-col gap-0.5">
                  {tickets.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => go(t.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STATUS_COLOR[t.status] ?? 'var(--color-txt3)' }} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold" style={{ color: 'var(--color-txt1)' }}>
                            #{t.ticket_number}
                          </span>
                          <span className="text-xs capitalize truncate" style={{ color: 'var(--color-txt2)' }}>
                            {t.category?.name ?? t.category}
                          </span>
                          {t.is_priority && (
                            <span className="px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 9 }}>
                              Priority
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--color-txt3)' }}>
                          {[t.building?.name, t.floor?.name, t.client?.name].filter(Boolean).join(' · ')}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded-full capitalize"
                          style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)', fontSize: 10 }}>
                          {t.status.replace('_', ' ')}
                        </span>
                        <span style={{ color: 'var(--color-txt3)', fontSize: 10 }}>
                          {t.source === 'client' ? 'Client' : 'CEM'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}
    </>
  )
}
