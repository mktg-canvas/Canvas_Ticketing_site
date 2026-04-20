import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = ['all','open','acknowledged','in_progress','on_hold','resolved','closed']

export default function MyTickets() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const { data, isLoading } = useTickets(status !== 'all' ? { status } : {})
  const tickets = data?.tickets || []

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto" style={{ background: 'var(--color-bg0)' }}>
      <button onClick={() => navigate('/client/dashboard')} className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--color-txt2)' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>
      <h1 className="text-base font-semibold mb-4" style={{ color: 'var(--color-txt1)' }}>My Tickets</h1>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors"
            style={{
              background: status === s ? 'var(--color-accent)' : 'var(--color-bg2)',
              color: status === s ? '#fff' : 'var(--color-txt2)',
              border: `1px solid ${status === s ? 'var(--color-accent)' : 'var(--color-bg4)'}`,
            }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: 'var(--color-txt3)' }}>No tickets found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t: any) => (
            <TicketCard key={t.id} ticket={t} linkTo={`/client/tickets/${t.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
