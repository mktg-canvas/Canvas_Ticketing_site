import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open',        color: 'var(--color-danger)' },
  { value: 'in_progress', label: 'In Progress',  color: 'var(--color-warning)' },
  { value: 'closed',      label: 'Closed',       color: 'var(--color-success)' },
]

export default function AllTickets() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const { data, isLoading } = useTickets({ ...(status !== 'all' && { status }) })
  const tickets = data?.tickets || []

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg0)' }}>
      <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/fm/dashboard')}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>My Tickets</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)' }}>
              {data?.total ?? 0}
            </span>
          </div>
          <button
            onClick={() => navigate('/fm/raise-ticket')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Plus size={14} /> New
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex border-t" style={{ borderColor: 'var(--color-bg4)' }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className="flex-1 py-2.5 text-xs font-semibold relative transition-colors"
              style={{
                color: status === s.value ? (s.color || 'var(--color-accent)') : 'var(--color-txt3)',
              }}
            >
              {s.label}
              {status === s.value && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: s.color || 'var(--color-accent)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'var(--color-bg2)' }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-bg2)' }}>
              <Plus size={20} style={{ color: 'var(--color-txt3)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-txt2)' }}>No tickets found</p>
            <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>
              {status === 'all' ? 'Raise your first ticket to get started.' : `No ${status.replace('_', ' ')} tickets.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t: any) => <TicketCard key={t.id} ticket={t} linkTo={`/fm/tickets/${t.id}`} />)}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/fm/raise-ticket')}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 20px rgba(85,46,158,0.4)' }}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
