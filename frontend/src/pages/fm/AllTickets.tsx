import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = ['all', 'open', 'in_progress', 'closed']

export default function AllTickets() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const { data, isLoading } = useTickets({
    ...(status !== 'all' && { status }),
  })
  const tickets = data?.tickets || []

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg0)' }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fm/dashboard')}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>My Tickets</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>
            {data?.total || 0}
          </span>
        </div>
        <button onClick={() => navigate('/fm/raise-ticket')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          <Plus size={15} /> New
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors"
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
            {tickets.map((t: any) => <TicketCard key={t.id} ticket={t} linkTo={`/fm/tickets/${t.id}`} />)}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/fm/raise-ticket')}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: 'var(--color-accent)', color: '#fff' }}>
        <Plus size={24} />
      </button>
    </div>
  )
}
