import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Ticket, BarChart2, Plus, Columns2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import ProfileMenu from './ProfileMenu'

export default function SuperAdminNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const user      = useAuthStore(s => s.user)
  const path      = location.pathname

  const navBtn = (
    label: string,
    icon: React.ReactNode,
    route: string,
    active: boolean,
  ) => (
    <button
      aria-label={label}
      onClick={() => navigate(route)}
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs font-semibold border transition-colors"
      style={
        active
          ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
          : { borderColor: 'var(--color-bg4)', color: 'var(--color-txt2)', background: 'transparent' }
      }
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  )

  return (
    <>
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
          {navBtn('Analytics',    <BarChart2 size={15} />,  '/superadmin/analytics',    path === '/superadmin/analytics')}
          {navBtn('Live Status',  <Columns2 size={15} />,   '/superadmin/dashboard',    path === '/superadmin/dashboard')}
          {navBtn('Manage',       <Settings size={15} />,   '/superadmin/accounts',     path === '/superadmin/accounts')}
          {navBtn('Tickets',      <Ticket size={15} />,     '/superadmin/tickets',      path === '/superadmin/tickets')}
          {navBtn('Raise Ticket', <Plus size={15} />,       '/superadmin/raise-ticket', path === '/superadmin/raise-ticket')}
          <ProfileMenu />
        </div>
      </header>
      {/* Spacer so page content clears the fixed nav */}
      <div className="h-16 sm:h-20" aria-hidden />
    </>
  )
}
