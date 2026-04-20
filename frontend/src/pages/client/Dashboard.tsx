import { useNavigate } from 'react-router-dom'
import { Plus, Ticket, Clock, CheckCircle } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useAuthStore } from '../../store/authStore'
import TicketCard from '../../components/tickets/TicketCard'
import ProfileMenu from '../../components/shared/ProfileMenu'

export default function ClientDashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data, isLoading } = useTickets()

  const tickets = data?.tickets || []
  const open = tickets.filter((t: any) => t.status === 'open').length
  const inProgress = tickets.filter((t: any) => t.status === 'in_progress').length
  const resolved = tickets.filter((t: any) => ['resolved','closed'].includes(t.status)).length

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-3xl mx-auto" style={{ background: 'var(--color-bg0)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--color-txt1)' }}>Hello, {user?.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt2)' }}>Canvas Workspace Support</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/client/raise-ticket')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '44px' }}>
            <Plus size={16} /> Raise Ticket
          </button>
          <ProfileMenu />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Open', count: open, icon: Ticket, color: 'var(--color-danger)' },
          { label: 'In Progress', count: inProgress, icon: Clock, color: 'var(--color-warning)' },
          { label: 'Resolved', count: resolved, icon: CheckCircle, color: 'var(--color-success)' },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-3 border text-center" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            <Icon size={18} style={{ color, margin: '0 auto 4px' }} />
            <p className="text-xl font-bold" style={{ color }}>{count}</p>
            <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>My Tickets</h2>
        <button onClick={() => navigate('/client/tickets')} className="text-xs" style={{ color: 'var(--color-accent)' }}>View all →</button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 rounded-xl border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <Ticket size={32} style={{ color: 'var(--color-txt3)', margin: '0 auto 8px' }} />
          <p className="text-sm mb-3" style={{ color: 'var(--color-txt2)' }}>No tickets yet</p>
          <button onClick={() => navigate('/client/raise-ticket')}
            className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--color-accent)', color: '#fff' }}>
            Raise your first ticket
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.slice(0, 5).map((t: any) => (
            <TicketCard
              key={t.id}
              ticket={t}
              linkTo={`/client/tickets/${t.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
