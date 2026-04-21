import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, CheckCircle, Plus } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg0)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Canvas" className="h-10 w-auto object-contain" />
          <div className="w-px h-8" style={{ background: 'var(--color-bg4)' }} />
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-txt1)' }}>Facility Manager</p>
            <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/fm/raise-ticket')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Plus size={16} /> Raise Ticket
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
        linkPrefix="/fm/tickets"
      />
    </div>
  )
}
