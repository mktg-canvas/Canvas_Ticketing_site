import { useNavigate } from 'react-router-dom'
import { Settings, Ticket } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useAuthStore } from '../../store/authStore'
import ProfileMenu from '../../components/shared/ProfileMenu'
import KanbanBoard from '../../components/shared/KanbanBoard'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useTickets()
  const tickets = data?.tickets || []

  const open       = tickets.filter((t: any) => t.status === 'open')
  const inProgress = tickets.filter((t: any) => t.status === 'in_progress')
  const closed     = tickets.filter((t: any) => t.status === 'closed')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg0)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Canvas" className="h-8 w-auto object-contain" />
          <div className="hidden sm:block w-px h-7" style={{ background: 'var(--color-bg4)' }} />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-txt1)' }}>Super Admin</p>
            <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: icon buttons only */}
          <button
            onClick={() => navigate('/superadmin/accounts')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Manage</span>
          </button>
          <button
            onClick={() => navigate('/superadmin/tickets')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)', background: 'transparent' }}
          >
            <Ticket size={15} />
            <span className="hidden sm:inline">All Tickets</span>
          </button>
          <ProfileMenu />
        </div>
      </header>

      {/* Kanban */}
      <KanbanBoard
        open={open}
        inProgress={inProgress}
        closed={closed}
        isLoading={isLoading}
        linkPrefix="/superadmin/tickets"
      />
    </div>
  )
}
