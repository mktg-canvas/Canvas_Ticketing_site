import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = ['all','open','acknowledged','in_progress','on_hold','resolved','closed']
const PRIORITIES = ['all','critical','high','medium','low']

export default function AllTickets() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [priority, setPriority] = useState('all')

  const { data, isLoading } = useTickets({
    ...(status !== 'all' && { status }),
    ...(priority !== 'all' && { priority }),
  })
  const tickets = data?.tickets || []

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--color-bg0)' }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--color-txt2)' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-semibold" style={{ color: 'var(--color-txt1)' }}>All Tickets</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>{data?.total || 0}</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize"
              style={{ background: status === s ? 'var(--color-accent)' : 'var(--color-bg2)', color: status === s ? '#fff' : 'var(--color-txt2)', border: `1px solid ${status === s ? 'var(--color-accent)' : 'var(--color-bg4)'}` }}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap mb-5">
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize"
              style={{ background: priority === p ? 'var(--color-bg3)' : 'var(--color-bg2)', color: priority === p ? 'var(--color-txt1)' : 'var(--color-txt3)', border: `1px solid ${priority === p ? 'var(--color-accent)' : 'var(--color-bg4)'}` }}>
              {p}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}</div>
        ) : tickets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--color-txt3)' }}>No tickets found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t: any) => <TicketCard key={t.id} ticket={t} linkTo={`/admin/tickets/${t.id}`} />)}
          </div>
        )}
      </div>
    </div>
  )
}
