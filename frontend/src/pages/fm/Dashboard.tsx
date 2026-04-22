import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useAuthStore } from '../../store/authStore'
import ProfileMenu from '../../components/shared/ProfileMenu'
import KanbanBoard from '../../components/shared/KanbanBoard'

export default function FmDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useTickets()
  const tickets = data?.tickets || []

  const open       = tickets.filter((t: any) => t.status === 'open')
  const inProgress = tickets.filter((t: any) => t.status === 'in_progress')
  const closed     = tickets.filter((t: any) => t.status === 'closed')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg0)' }}>

      {/* Floating pill nav */}
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
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pl-1">
          <img src="/logo.png" alt="Canvas" className="h-7 sm:h-8 w-auto object-contain shrink-0" />
          <div className="hidden sm:block w-px h-6" style={{ background: 'var(--color-bg4)' }} />
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--color-txt1)' }}>Facility Manager</p>
            <p className="text-[11px] truncate" style={{ color: 'var(--color-txt3)' }}>{user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            aria-label="Raise ticket"
            onClick={() => navigate('/fm/raise-ticket')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Raise Ticket</span>
            <span className="sm:hidden">New</span>
          </button>
          <ProfileMenu />
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16 sm:h-20" aria-hidden />

      <KanbanBoard
        open={open}
        inProgress={inProgress}
        closed={closed}
        isLoading={isLoading}
        linkPrefix="/fm/tickets"
      />
    </div>
  )
}
