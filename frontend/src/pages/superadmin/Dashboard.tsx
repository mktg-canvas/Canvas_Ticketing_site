import { useNavigate } from 'react-router-dom'
import { Building2, Layers, Briefcase, Ticket, Users, Settings } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useBuildings } from '../../hooks/useBuildings'
import { useCompanies } from '../../hooks/useCompanies'
import { useUsers } from '../../hooks/useUsers'
import ProfileMenu from '../../components/shared/ProfileMenu'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { data: ticketsData } = useTickets()
  const { data: buildings = [] } = useBuildings()
  const { data: companies = [] } = useCompanies()
  const { data: users = [] } = useUsers()

  const tickets = ticketsData?.tickets || []
  const openTickets = tickets.filter((t: any) => t.status === 'open').length
  const fms = users.filter((u: any) => u.role === 'fm').length

  const stats = [
    { label: 'Buildings', count: buildings.length, icon: Building2, color: 'var(--color-accent)', path: '/superadmin/accounts?tab=buildings' },
    { label: 'Companies', count: companies.length, icon: Briefcase, color: 'var(--color-success)', path: '/superadmin/accounts?tab=companies' },
    { label: 'FMs', count: fms, icon: Users, color: 'var(--color-warning)', path: '/superadmin/accounts?tab=fms' },
    { label: 'Open Tickets', count: openTickets, icon: Ticket, color: 'var(--color-danger)', path: '/superadmin/tickets' },
  ]

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--color-bg0)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Canvas" className="h-16 w-auto hidden sm:block object-contain p-1" />
            <div>
              <h1 className="text-base font-semibold" style={{ color: 'var(--color-txt1)' }}>Super Admin</h1>
              <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>Global overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/superadmin/accounts')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-accent)', color: '#fff' }}>
              <Settings size={15} /> Manage
            </button>
            <ProfileMenu />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map(({ label, count, icon: Icon, color, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="rounded-xl p-4 border text-left hover:border-accent transition-colors active:scale-[0.98]"
              style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
              <Icon size={18} style={{ color, marginBottom: 6 }} />
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>{label}</p>
            </button>
          ))}
        </div>

        {/* FM list */}
        {fms > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-bg4)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>Facility Managers</h2>
            </div>
            <div>
              {users.filter((u: any) => u.role === 'fm').map((u: any, i: number, arr: any[]) => (
                <div key={u.id} className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-bg4)' : 'none' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-txt1)' }}>{u.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>{u.email}</p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
