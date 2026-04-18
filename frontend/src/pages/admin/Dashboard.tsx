import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import TicketCard from '../../components/tickets/TicketCard'
import { useAuthStore } from '../../store/authStore'
import ProfileMenu from '../../components/shared/ProfileMenu'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useTickets()
  const tickets = data?.tickets || []

  const open = tickets.filter((t: any) => t.status === 'open').length
  const inProgress = tickets.filter((t: any) => t.status === 'in_progress').length
  const resolvedToday = tickets.filter((t: any) => {
    if (t.status !== 'resolved' || !t.resolved_at) return false
    const d = new Date(t.resolved_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  const needsAttention = tickets.filter((t: any) => {
    if (t.status !== 'open') return false
    const diff = Date.now() - new Date(t.created_at).getTime()
    return diff > 2 * 3600 * 1000
  })

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0f1117' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold" style={{ color: '#e8eaf0' }}>Admin Panel</h1>
            <p className="text-xs" style={{ color: '#8b92a5' }}>{user?.name}</p>
          </div>
          <ProfileMenu />
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Open', count: open, icon: Ticket, color: '#f05252', filter: 'open' },
            { label: 'In Progress', count: inProgress, icon: Clock, color: '#f5a623', filter: 'in_progress' },
            { label: 'Resolved Today', count: resolvedToday, icon: CheckCircle, color: '#2ecc8a', filter: 'resolved' },
            { label: 'Needs Attention', count: needsAttention.length, icon: AlertTriangle, color: '#f05252', filter: 'open' },
          ].map(({ label, count, icon: Icon, color, filter }) => (
            <button key={label} onClick={() => navigate(`/admin/tickets?status=${filter}`)}
              className="rounded-xl p-4 border text-left transition-colors hover:border-accent"
              style={{ background: '#181c24', borderColor: '#2e3545' }}>
              <Icon size={18} style={{ color, marginBottom: 6 }} />
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: '#8b92a5' }}>{label}</p>
            </button>
          ))}
        </div>

        {/* Needs attention */}
        {needsAttention.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#f05252' }}>
              <AlertTriangle size={14} /> Needs Attention — unacknowledged &gt; 2h
            </h2>
            <div className="flex flex-col gap-3">
              {needsAttention.slice(0, 3).map((t: any) => (
                <TicketCard key={t.id} ticket={t} linkTo={`/admin/tickets/${t.id}`} />
              ))}
            </div>
          </div>
        )}

        {/* Recent tickets */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>Recent Tickets</h2>
          <button onClick={() => navigate('/admin/tickets')} className="text-xs" style={{ color: '#4f8ef7' }}>View all →</button>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: '#1f2330' }} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.slice(0, 8).map((t: any) => (
              <TicketCard key={t.id} ticket={t} linkTo={`/admin/tickets/${t.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
