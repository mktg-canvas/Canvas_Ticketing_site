import { useNavigate } from 'react-router-dom'
import { Settings, Ticket, BarChart2 } from 'lucide-react'
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

      {/* Floating pill nav — always visible while scrolling */}
      <header
        className="fixed top-3 left-3 right-3 z-40 flex items-center justify-between gap-2 px-3 py-2 rounded-full border"
        style={{
          background: 'var(--color-bg1)',
          borderColor: 'var(--color-bg4)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
          backdropFilter: 'saturate(180%) blur(8px)',
          WebkitBackdropFilter: 'saturate(180%) blur(8px)',
        }}
      >
        {/* Left: logo + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pl-1">
          <img src="/logo.png" alt="Canvas" className="h-7 sm:h-8 w-auto object-contain shrink-0" />
          <div className="hidden sm:block w-px h-6" style={{ background: 'var(--color-bg4)' }} />
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--color-txt1)' }}>Super Admin</p>
            <p className="text-[11px] truncate" style={{ color: 'var(--color-txt3)' }}>{user?.name}</p>
          </div>
        </div>

        {/* Right: actions + profile */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            aria-label="Analytics"
            onClick={() => navigate('/superadmin/analytics')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs font-semibold border"
            style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)', background: 'transparent' }}
          >
            <BarChart2 size={15} />
            <span className="hidden md:inline">Analytics</span>
          </button>
          <button
            aria-label="Manage"
            onClick={() => navigate('/superadmin/accounts')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Settings size={15} />
            <span className="hidden md:inline">Manage</span>
          </button>
          <button
            aria-label="Tickets"
            onClick={() => navigate('/superadmin/tickets')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs font-semibold border"
            style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)', background: 'transparent' }}
          >
            <Ticket size={15} />
            <span className="hidden md:inline">Tickets</span>
          </button>
          <ProfileMenu />
        </div>
      </header>

      {/* Spacer so content doesn't sit under nav */}
      <div className="h-16 sm:h-20" aria-hidden />

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
