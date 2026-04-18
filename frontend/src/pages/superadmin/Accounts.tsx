import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Building2, Users, UserCheck } from 'lucide-react'
import { useCompanies, useCreateCompany, useUpdateCompany } from '../../hooks/useCompanies'
import { useUsers, useCreateUser, useDeactivateUser, useUpdateUser } from '../../hooks/useUsers'

const TABS = [
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'admins', label: 'Admins', icon: UserCheck },
  { key: 'clients', label: 'Clients', icon: Users },
]

const inputStyle = { background: '#262c3a', borderColor: '#2e3545', color: '#e8eaf0' }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-xl p-6 border" style={{ background: '#181c24', borderColor: '#2e3545' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>{title}</h2>
          <button onClick={onClose}><X size={16} style={{ color: '#565e72' }} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Accounts() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'companies')
  const [showModal, setShowModal] = useState<'company' | 'admin' | 'client' | 'assign' | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const { data: companies = [] } = useCompanies()
  const { data: users = [] } = useUsers()
  const { mutateAsync: createCompany, isPending: creatingCompany } = useCreateCompany()
  const { mutateAsync: createUser, isPending: creatingUser } = useCreateUser()
  const { mutateAsync: deactivateUser } = useDeactivateUser()
  const { mutateAsync: updateUser } = useUpdateUser()

  const admins = users.filter((u: any) => u.role === 'admin')
  const clients = users.filter((u: any) => u.role === 'client')

  function field(key: string, label: string, type = 'text', placeholder = '') {
    return (
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>{label}</label>
        <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="rounded-lg px-3 py-2.5 text-base outline-none border"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#4f8ef7')}
          onBlur={e => (e.target.style.borderColor = '#2e3545')} />
      </div>
    )
  }

  async function handleCreateCompany() {
    setError('')
    try {
      await createCompany({ name: form.name, officeLocation: form.officeLocation, assignedAdminId: form.assignedAdminId || undefined })
      setShowModal(null); setForm({})
    } catch (e: any) { setError(e.response?.data?.error || 'Failed') }
  }

  async function handleCreateUser(role: 'admin' | 'client') {
    setError('')
    try {
      await createUser({ name: form.name, email: form.email, password: form.password, role, companyId: form.companyId || undefined })
      setShowModal(null); setForm({})
    } catch (e: any) { setError(e.response?.data?.error || 'Failed') }
  }

  async function handleAssign() {
    setError('')
    try {
      await updateUser({ id: selectedUser.id, companyId: form.companyId })
      setShowModal(null); setForm({}); setSelectedUser(null)
    } catch (e: any) { setError(e.response?.data?.error || 'Failed') }
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0f1117' }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/superadmin/dashboard')} className="flex items-center gap-2 text-sm mb-5" style={{ color: '#8b92a5' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-base font-semibold" style={{ color: '#e8eaf0' }}>Account Management</h1>
          <button onClick={() => { setShowModal(tab === 'companies' ? 'company' : tab === 'admins' ? 'admin' : 'client'); setForm({}) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#4f8ef7', color: '#fff' }}>
            <Plus size={15} /> Add {tab === 'companies' ? 'Company' : tab === 'admins' ? 'Admin' : 'Client'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: '#181c24' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: tab === key ? '#262c3a' : 'transparent', color: tab === key ? '#e8eaf0' : '#565e72' }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Companies */}
        {tab === 'companies' && (
          <div className="flex flex-col gap-3">
            {companies.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#565e72' }}>No companies yet. Add one to get started.</p>
            ) : companies.map((c: any) => (
              <div key={c.id} className="rounded-xl p-4 border" style={{ background: '#181c24', borderColor: '#2e3545' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>{c.name}</p>
                    {c.office_location && <p className="text-xs mt-0.5" style={{ color: '#8b92a5' }}>{c.office_location}</p>}
                    <p className="text-xs mt-1" style={{ color: '#565e72' }}>
                      Admin: {c.assigned_admin?.name || <span style={{ color: '#f05252' }}>Unassigned</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#8b92a5' }}>
                    <span>{c._count?.tickets || 0} tickets</span>
                    <span>{c._count?.users || 0} clients</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admins */}
        {tab === 'admins' && (
          <div className="flex flex-col gap-3">
            {admins.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#565e72' }}>No admin accounts yet.</p>
            ) : admins.map((u: any) => (
              <div key={u.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: '#181c24', borderColor: '#2e3545' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8b92a5' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#565e72' }}>
                    {companies.find((c: any) => c.assigned_admin?.id === u.id)?.name || 'No company assigned'}
                  </p>
                </div>
                <button onClick={() => { deactivateUser(u.id) }}
                  className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(240,82,82,0.1)', color: '#f05252' }}>
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Clients */}
        {tab === 'clients' && (
          <div className="flex flex-col gap-3">
            {clients.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#565e72' }}>No client accounts yet.</p>
            ) : clients.map((u: any) => (
              <div key={u.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: '#181c24', borderColor: '#2e3545' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8b92a5' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: u.company_id ? '#2ecc8a' : '#f05252' }}>
                    {companies.find((c: any) => c.id === u.company_id)?.name || '⚠ No company assigned'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedUser(u); setShowModal('assign'); setForm({}) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#262c3a', color: '#4f8ef7' }}>
                    Assign
                  </button>
                  <button onClick={() => deactivateUser(u.id)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(240,82,82,0.1)', color: '#f05252' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {showModal === 'company' && (
        <Modal title="Add Company" onClose={() => setShowModal(null)}>
          {field('name', 'Company Name *', 'text', 'e.g. TechCorp India')}
          {field('officeLocation', 'Office Location', 'text', 'e.g. Mumbai, Floor 3')}
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Assign Admin</label>
            <select value={form.assignedAdminId || ''} onChange={e => setForm(f => ({ ...f, assignedAdminId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select admin —</option>
              {admins.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: '#f05252' }}>{error}</p>}
          <button onClick={handleCreateCompany} disabled={creatingCompany || !form.name}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: '#4f8ef7', color: '#fff' }}>
            {creatingCompany ? 'Creating...' : 'Create Company'}
          </button>
        </Modal>
      )}

      {/* Create Admin Modal */}
      {showModal === 'admin' && (
        <Modal title="Add Admin" onClose={() => setShowModal(null)}>
          {field('name', 'Full Name *')}
          {field('email', 'Email *', 'email')}
          {field('password', 'Temporary Password *', 'password')}
          {error && <p className="text-xs mb-3" style={{ color: '#f05252' }}>{error}</p>}
          <button onClick={() => handleCreateUser('admin')} disabled={creatingUser || !form.name || !form.email || !form.password}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: '#4f8ef7', color: '#fff' }}>
            {creatingUser ? 'Creating...' : 'Create Admin'}
          </button>
        </Modal>
      )}

      {/* Create Client Modal */}
      {showModal === 'client' && (
        <Modal title="Add Client" onClose={() => setShowModal(null)}>
          {field('name', 'Full Name *')}
          {field('email', 'Email *', 'email')}
          {field('password', 'Temporary Password *', 'password')}
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Assign to Company *</label>
            <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select company —</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: '#f05252' }}>{error}</p>}
          <button onClick={() => handleCreateUser('client')} disabled={creatingUser || !form.name || !form.email || !form.password || !form.companyId}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: '#4f8ef7', color: '#fff' }}>
            {creatingUser ? 'Creating...' : 'Create Client'}
          </button>
        </Modal>
      )}

      {/* Assign Company Modal */}
      {showModal === 'assign' && selectedUser && (
        <Modal title={`Assign ${selectedUser.name} to Company`} onClose={() => setShowModal(null)}>
          <p className="text-xs mb-4" style={{ color: '#8b92a5' }}>{selectedUser.email}</p>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Company</label>
            <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select company —</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: '#f05252' }}>{error}</p>}
          <button onClick={handleAssign} disabled={!form.companyId}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: '#4f8ef7', color: '#fff' }}>
            Assign
          </button>
        </Modal>
      )}
    </div>
  )
}
