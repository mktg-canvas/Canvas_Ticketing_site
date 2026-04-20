import { useNavigate } from 'react-router-dom'
import { Building2, Users, Ticket, Settings } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useCompanies } from '../../hooks/useCompanies'
import { useUsers } from '../../hooks/useUsers'
import ProfileMenu from '../../components/shared/ProfileMenu'

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { data: ticketsData } = useTickets()
  const { data: companies = [] } = useCompanies()
  const { data: users = [] } = useUsers()

  const tickets = ticketsData?.tickets || []
  const openTickets = tickets.filter((t: any) => t.status === 'open').length
  const admins = users.filter((u: any) => u.role === 'admin').length
  const clients = users.filter((u: any) => u.role === 'client').length

  const cards = [
    { label: 'Companies', count: companies.length, icon: Building2, color: 'var(--color-accent)', path: '/superadmin/accounts?tab=companies' },
    { label: 'Admins', count: admins, icon: Users, color: 'var(--color-success)', path: '/superadmin/accounts?tab=admins' },
    { label: 'Clients', count: clients, icon: Users, color: 'var(--color-warning)', path: '/superadmin/accounts?tab=clients' },
    { label: 'Open Tickets', count: openTickets, icon: Ticket, color: 'var(--color-danger)', path: '/superadmin/tickets' },
  ]

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--color-bg0)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-txt1)' }}>Super Admin</h1>
            <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>Global overview — all offices</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/superadmin/accounts')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-accent)', color: '#fff' }}>
              <Settings size={15} /> Manage Accounts
            </button>
            <ProfileMenu />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {cards.map(({ label, count, icon: Icon, color, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="rounded-xl p-4 border text-left hover:border-accent transition-colors"
              style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
              <Icon size={18} style={{ color, marginBottom: 6 }} />
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: 'var(--color-txt2)' }}>{label}</p>
            </button>
          ))}
        </div>

        {/* Admin performance table */}
        {admins > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-bg4)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>Admin Overview</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-bg4)' }}>
                    {['Name', 'Email', 'Company', 'Last Active'].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--color-txt3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u: any) => u.role === 'admin').map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-bg4)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--color-txt1)' }}>{u.name}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-txt2)' }}>{u.email}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-txt2)' }}>
                        {companies.find((c: any) => c.assigned_admin?.id === u.id)?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-txt3)' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
