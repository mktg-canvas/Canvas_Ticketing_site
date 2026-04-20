import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Building2, Users, UserCheck } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useCompanies, useCreateCompany, useDeactivateCompany, useUpdateCompany } from '../../hooks/useCompanies'
import { useUsers, useCreateUser, useDeactivateUser, useUpdateUser } from '../../hooks/useUsers'

const TABS = [
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'admins', label: 'Admins', icon: UserCheck },
  { key: 'clients', label: 'Clients', icon: Users },
]

const inputStyle = { background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'var(--bg-overlay-70)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-xl p-6 border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{title}</h2>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--color-txt3)' }} /></button>
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
  const [showModal, setShowModal] = useState<'company' | 'editCompany' | 'admin' | 'client' | 'editUser' | 'assign' | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const { data: companies = [] } = useCompanies()
  const { data: users = [] } = useUsers()
  const { mutateAsync: createCompany, isPending: creatingCompany } = useCreateCompany()
  const { mutateAsync: updateCompany, isPending: updatingCompany } = useUpdateCompany()
  const { mutateAsync: deactivateCompany } = useDeactivateCompany()
  const { mutateAsync: createUser, isPending: creatingUser } = useCreateUser()
  const { mutateAsync: deactivateUser } = useDeactivateUser()
  const { mutateAsync: updateUser, isPending: updatingUser } = useUpdateUser()

  const admins = users.filter((u: any) => u.role === 'admin')
  const clients = users.filter((u: any) => u.role === 'client')

  function field(key: string, label: string, type = 'text', placeholder = '', readOnly = false) {
    return (
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>{label}</label>
        <input type={type} value={form[key] || ''} onChange={e => !readOnly && setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          readOnly={readOnly}
          className="rounded-lg px-3 py-2.5 text-base outline-none border"
          style={{ ...inputStyle, opacity: readOnly ? 0.6 : 1 }}
          onFocus={e => !readOnly && (e.target.style.borderColor = 'var(--color-accent)')}
          onBlur={e => !readOnly && (e.target.style.borderColor = 'var(--color-bg4)')} />
      </div>
    )
  }

  async function handleCreateCompany() {
    setError('')
    try {
      await createCompany({ name: form.name, officeLocation: form.officeLocation, assignedAdminId: form.assignedAdminId || undefined })
      setShowModal(null); setForm({})
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const errData = e.response?.data?.error
        setError(typeof errData === 'object' && errData !== null ? Object.values(errData).flat().join(', ') : errData || 'Failed')
      } else {
        setError('Failed')
      }
    }
  }

  async function handleEditCompany() {
    setError('')
    try {
      await updateCompany({ 
        id: selectedCompany.id, 
        name: form.name, 
        officeLocation: form.officeLocation, 
        assignedAdminId: form.assignedAdminId || undefined 
      })
      setShowModal(null); setForm({}); setSelectedCompany(null)
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const errData = e.response?.data?.error
        setError(typeof errData === 'object' && errData !== null ? Object.values(errData).flat().join(', ') : errData || 'Failed')
      } else {
        setError('Failed')
      }
    }
  }

  async function handleCreateUser(role: 'admin' | 'client') {
    setError('')
    try {
      await createUser({ name: form.name, email: form.email, password: form.password, role, companyId: form.companyId || undefined })
      setShowModal(null); setForm({})
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const errData = e.response?.data?.error
        setError(typeof errData === 'object' && errData !== null ? Object.values(errData).flat().join(', ') : errData || 'Failed')
      } else {
        setError('Failed')
      }
    }
  }

  async function handleEditUser() {
    setError('')
    try {
      await updateUser({ 
        id: selectedUser.id, 
        name: form.name, 
        // We only allow editing the company if they are a client. 
        // Admins are assigned from the Company Edit screen, not the User Edit screen.
        companyId: selectedUser.role === 'client' ? (form.companyId || undefined) : undefined 
      })
      setShowModal(null); setForm({}); setSelectedUser(null)
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const errData = e.response?.data?.error
        setError(typeof errData === 'object' && errData !== null ? Object.values(errData).flat().join(', ') : errData || 'Failed')
      } else {
        setError('Failed')
      }
    }
  }

  async function handleAssign() {
    setError('')
    try {
      await updateUser({ id: selectedUser.id, companyId: form.companyId })
      setShowModal(null); setForm({}); setSelectedUser(null)
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        const errData = e.response?.data?.error
        setError(typeof errData === 'object' && errData !== null ? Object.values(errData).flat().join(', ') : errData || 'Failed')
      } else {
        setError('Failed')
      }
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--color-bg0)' }}>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/superadmin/dashboard')} className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--color-txt2)' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-base font-semibold" style={{ color: 'var(--color-txt1)' }}>Account Management</h1>
          <button onClick={() => { setShowModal(tab === 'companies' ? 'company' : tab === 'admins' ? 'admin' : 'client'); setForm({}) }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            <Plus size={15} /> Add {tab === 'companies' ? 'Company' : tab === 'admins' ? 'Admin' : 'Client'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--color-bg1)' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: tab === key ? 'var(--color-bg3)' : 'transparent', color: tab === key ? 'var(--color-txt1)' : 'var(--color-txt3)' }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Companies */}
        {tab === 'companies' && (
          <div className="flex flex-col gap-3">
            {companies.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No companies yet. Add one to get started.</p>
            ) : companies.map((c: any) => (
              <div key={c.id} className="rounded-xl p-4 border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{c.name}</p>
                    {c.office_location && <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt2)' }}>{c.office_location}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--color-txt3)' }}>
                      Admin: {c.assigned_admin?.name || <span style={{ color: 'var(--color-danger)' }}>Unassigned</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-txt2)' }}>
                      <span>{c._count?.tickets || 0} tickets</span>
                      <span>{c._count?.users || 0} clients</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { 
                        setSelectedCompany(c); 
                        setForm({ name: c.name, officeLocation: c.office_location || '', assignedAdminId: c.assigned_admin?.id || '' }); 
                        setShowModal('editCompany'); 
                      }}
                        className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>
                        Edit
                      </button>
                      <button onClick={() => { if(confirm(`Deactivate ${c.name}?`)) deactivateCompany(c.id) }}
                        className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
                        Deactivate
                      </button>
                    </div>
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
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No admin accounts yet.</p>
            ) : admins.map((u: any) => (
              <div key={u.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt2)' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
                    {companies.find((c: any) => c.assigned_admin?.id === u.id)?.name || 'No company assigned'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { 
                    setSelectedUser(u); 
                    setForm({ name: u.name, email: u.email }); 
                    setShowModal('editUser'); 
                  }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>
                    Edit
                  </button>
                  <button onClick={() => { deactivateUser(u.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clients */}
        {tab === 'clients' && (
          <div className="flex flex-col gap-3">
            {clients.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No client accounts yet.</p>
            ) : clients.map((u: any) => (
              <div key={u.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt2)' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: u.company_id ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {companies.find((c: any) => c.id === u.company_id)?.name || '⚠ No company assigned'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { 
                    setSelectedUser(u); 
                    setForm({ name: u.name, email: u.email, companyId: u.company_id || '' }); 
                    setShowModal('editUser'); 
                  }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>
                    Edit
                  </button>
                  <button onClick={() => deactivateUser(u.id)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
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
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Canvas Building</label>
            <select value={form.officeLocation || ''} onChange={e => setForm(f => ({ ...f, officeLocation: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select building —</option>
              {['Canvas 144', 'Canvas 1331', 'Canvas 1317', 'Canvas 434', 'Canvas 435', 'Canvas 246', 'Canvas 502', 'Canvas 370', 'Canvas 1', 'Canvas 527'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Assign Admin</label>
            <select value={form.assignedAdminId || ''} onChange={e => setForm(f => ({ ...f, assignedAdminId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select admin —</option>
              {admins.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={handleCreateCompany} disabled={creatingCompany || !form.name}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingCompany ? 'Creating...' : 'Create Company'}
          </button>
        </Modal>
      )}

      {/* Edit Company Modal */}
      {showModal === 'editCompany' && selectedCompany && (
        <Modal title="Edit Company" onClose={() => { setShowModal(null); setSelectedCompany(null); }}>
          {field('name', 'Company Name *', 'text', 'e.g. TechCorp India', true)}
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Canvas Building</label>
            <select value={form.officeLocation || ''} onChange={e => setForm(f => ({ ...f, officeLocation: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select building —</option>
              {['Canvas 144', 'Canvas 1331', 'Canvas 1317', 'Canvas 434', 'Canvas 435', 'Canvas 246', 'Canvas 502', 'Canvas 370', 'Canvas 1', 'Canvas 527'].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Assign Admin</label>
            <select value={form.assignedAdminId || ''} onChange={e => setForm(f => ({ ...f, assignedAdminId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select admin —</option>
              {admins.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={handleEditCompany} disabled={updatingCompany}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingCompany ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {/* Create Admin Modal */}
      {showModal === 'admin' && (
        <Modal title="Add Admin" onClose={() => setShowModal(null)}>
          {field('name', 'Full Name *')}
          {field('email', 'Email *', 'email')}
          {field('password', 'Temporary Password *', 'password')}
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => handleCreateUser('admin')} disabled={creatingUser || !form.name || !form.email || !form.password}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
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
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Assign to Company *</label>
            <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select company —</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => handleCreateUser('client')} disabled={creatingUser || !form.name || !form.email || !form.password || !form.companyId}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingUser ? 'Creating...' : 'Create Client'}
          </button>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showModal === 'editUser' && selectedUser && (
        <Modal title={`Edit ${selectedUser.role === 'admin' ? 'Admin' : 'Client'}`} onClose={() => { setShowModal(null); setSelectedUser(null); }}>
          {field('name', 'Full Name *')}
          {field('email', 'Email *', 'email', '', true)}
          {selectedUser.role === 'client' && (
            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Assigned Company</label>
              <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
                <option value=''>— Select company —</option>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={handleEditUser} disabled={updatingUser || !form.name}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingUser ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {/* Assign Company Modal (Legacy button preserved for convenience) */}
      {showModal === 'assign' && selectedUser && (
        <Modal title={`Assign ${selectedUser.name} to Company`} onClose={() => setShowModal(null)}>
          <p className="text-xs mb-4" style={{ color: 'var(--color-txt2)' }}>{selectedUser.email}</p>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Company</label>
            <select value={form.companyId || ''} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
              className="rounded-lg px-3 py-2.5 text-base outline-none border" style={inputStyle}>
              <option value=''>— Select company —</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={handleAssign} disabled={!form.companyId}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            Assign
          </button>
        </Modal>
      )}
    </div>
  )
}
