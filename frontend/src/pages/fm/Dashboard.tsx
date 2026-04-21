import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, CheckCircle, Plus } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import TicketCard from '../../components/tickets/TicketCard'
import { useAuthStore } from '../../store/authStore'
import ProfileMenu from '../../components/shared/ProfileMenu'

export default function FmDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useTickets()
  const tickets = data?.tickets || []

  const open = tickets.filter((t: any) => t.status === 'open').length
  const inProgress = tickets.filter((t: any) => t.status === 'in_progress').length
  const closedToday = tickets.filter((t: any) => {
    if (t.status !== 'closed' || !t.closed_at) return false
    return new Date(t.closed_at).toDateString() === new Date().toDateString()
  }).length

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--color-bg0)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Canvas" className="h-16 w-auto hidden sm:block object-contain p-1" />
            <div>
              <h1 className="text-base font-semibold" style={{ color: 'var(--color-txt1)' }}>Facility Manager</h1>
              <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>{user?.name}</p>
            </div>
          </div>
          <ProfileMenu />
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Open', count: open, icon: Ticket, color: 'var(--color-danger)', filter: 'open' },
            { label: 'In Progress', count: inProgress, icon: Clock, color: 'var(--color-warning)', filter: 'in_progress' },
            { label: 'Closed Today', count: closedToday, icon: CheckCircle, color: 'var(--color-success)', filter: 'closed' },
          ].map(({ label, count, icon: Icon, color, filter }) => (
            <button key={label} onClick={() => navigate(`/fm/tickets?status=${filter}`)}
              className="rounded-xl p-3 border text-left transition-colors hover:border-accent active:scale-[0.98]"
              style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
              <Icon size={16} style={{ color, marginBottom: 4 }} />
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>{label}</p>
            </button>
          ))}
        </div>

        {/* Raise ticket CTA */}
        <button
          onClick={() => navigate('/fm/raise-ticket')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mb-6 transition-opacity hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '48px' }}
        >
          <Plus size={18} /> Raise New Ticket
        </button>

        {/* Recent tickets */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>Recent Tickets</h2>
          <button onClick={() => navigate('/fm/tickets')} className="text-xs" style={{ color: 'var(--color-accent)' }}>View all →</button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--color-txt3)' }}>No tickets yet. Raise your first one above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.slice(0, 8).map((t: any) => (
              <TicketCard key={t.id} ticket={t} linkTo={`/fm/tickets/${t.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
