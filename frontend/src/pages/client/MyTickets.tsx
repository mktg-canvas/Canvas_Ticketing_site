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
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto" style={{ background: '#0f1117' }}>
      <button onClick={() => navigate('/client/dashboard')} className="flex items-center gap-2 text-sm mb-5" style={{ color: '#8b92a5' }}>
        <ArrowLeft size={16} /> Dashboard
      </button>
      <h1 className="text-base font-semibold mb-4" style={{ color: '#e8eaf0' }}>My Tickets</h1>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors"
            style={{
              background: status === s ? '#4f8ef7' : '#1f2330',
              color: status === s ? '#fff' : '#8b92a5',
              border: `1px solid ${status === s ? '#4f8ef7' : '#2e3545'}`,
            }}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: '#1f2330' }} />)}
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: '#565e72' }}>No tickets found.</p>
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
