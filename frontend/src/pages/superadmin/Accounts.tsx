import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Building2, Layers, Briefcase, UserCheck } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useBuildings, useCreateBuilding, useUpdateBuilding, useDeactivateBuilding } from '../../hooks/useBuildings'
import { useFloors, useCreateFloor, useUpdateFloor, useDeactivateFloor } from '../../hooks/useFloors'
import { useCompanies, useCreateCompany, useUpdateCompany, useDeactivateCompany } from '../../hooks/useCompanies'
import { useUsers, useCreateUser, useDeactivateUser, useUpdateUser } from '../../hooks/useUsers'

const TABS = [
  { key: 'buildings', label: 'Buildings', icon: Building2 },
  { key: 'floors', label: 'Floors', icon: Layers },
  { key: 'companies', label: 'Companies', icon: Briefcase },
  { key: 'fms', label: 'FMs', icon: UserCheck },
]

const inputCls = 'w-full rounded-lg px-3 py-2.5 text-base outline-none border'
const inputStyle = { background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-6 border"
        style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}
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

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; readOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>{label}</label>
      <input type={type} value={value} onChange={e => !readOnly && onChange(e.target.value)}
        placeholder={placeholder} readOnly={readOnly}
        className={inputCls} style={{ ...inputStyle, opacity: readOnly ? 0.6 : 1 }}
        onFocus={e => !readOnly && (e.target.style.borderColor = 'var(--color-accent)')}
        onBlur={e => !readOnly && (e.target.style.borderColor = 'var(--color-bg4)')} />
    </div>
  )
}

export default function Accounts() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'buildings')
  const [showModal, setShowModal] = useState<string | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const f = (key: string) => form[key] || ''
  const set = (key: string) => (v: string) => setForm(prev => ({ ...prev, [key]: v }))

  const { data: buildings = [] } = useBuildings()
  const { data: floors = [] } = useFloors()
  const { data: companies = [] } = useCompanies(undefined)
  const { data: users = [] } = useUsers()
  const fms = users.filter((u: any) => u.role === 'fm')

  const { mutateAsync: createBuilding, isPending: creatingBuilding } = useCreateBuilding()
  const { mutateAsync: updateBuilding, isPending: updatingBuilding } = useUpdateBuilding()
  const { mutateAsync: deactivateBuilding } = useDeactivateBuilding()

  const { mutateAsync: createFloor, isPending: creatingFloor } = useCreateFloor()
  const { mutateAsync: updateFloor, isPending: updatingFloor } = useUpdateFloor()
  const { mutateAsync: deactivateFloor } = useDeactivateFloor()

  const { mutateAsync: createCompany, isPending: creatingCompany } = useCreateCompany()
  const { mutateAsync: updateCompany, isPending: updatingCompany } = useUpdateCompany()
  const { mutateAsync: deactivateCompany } = useDeactivateCompany()

  const { mutateAsync: createUser, isPending: creatingUser } = useCreateUser()
  const { mutateAsync: deactivateUser } = useDeactivateUser()
  const { mutateAsync: updateUser, isPending: updatingUser } = useUpdateUser()

  function openModal(type: string, item?: any) {
    setError('')
    setSelected(item || null)
    if (item) {
      if (type === 'editBuilding') setForm({ name: item.name })
      if (type === 'editFloor') setForm({ name: item.name, buildingId: item.building_id })
      if (type === 'editCompany') setForm({ name: item.name, buildingId: item.building_id || '' })
      if (type === 'editFm') setForm({ name: item.name })
    } else {
      setForm({})
    }
    setShowModal(type)
  }

  function closeModal() { setShowModal(null); setSelected(null); setForm({}); setError('') }

  async function run(fn: () => Promise<void>) {
    setError('')
    try { await fn(); closeModal() }
    catch (e: unknown) {
      if (isAxiosError(e)) {
        const d = e.response?.data?.error
        setError(typeof d === 'object' ? Object.values(d).flat().join(', ') : d || 'Failed')
      } else setError('Failed')
    }
  }

  const addLabel = tab === 'buildings' ? 'Building' : tab === 'floors' ? 'Floor' : tab === 'companies' ? 'Company' : 'FM'
  const addModalKey = tab === 'buildings' ? 'addBuilding' : tab === 'floors' ? 'addFloor' : tab === 'companies' ? 'addCompany' : 'addFm'

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg0)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/superadmin/dashboard')}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>Account Management</h1>
        </div>
        <button onClick={() => openModal(addModalKey)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          <Plus size={15} /> Add {addLabel}
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--color-bg1)' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: tab === key ? 'var(--color-bg3)' : 'transparent',
                color: tab === key ? 'var(--color-txt1)' : 'var(--color-txt3)',
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Buildings */}
        {tab === 'buildings' && (
          <div className="flex flex-col gap-3">
            {buildings.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No buildings yet.</p>
            ) : buildings.map((b: any) => (
              <div key={b.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{b.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>{b._count?.floors || 0} floors · {b._count?.tickets || 0} tickets</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal('editBuilding', b)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>Edit</button>
                  <button onClick={() => { if (confirm(`Deactivate ${b.name}?`)) deactivateBuilding(b.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floors */}
        {tab === 'floors' && (
          <div className="flex flex-col gap-3">
            {floors.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No floors yet.</p>
            ) : floors.map((fl: any) => (
              <div key={fl.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{fl.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>{fl.building?.name} · {fl._count?.tickets || 0} tickets</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal('editFloor', fl)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>Edit</button>
                  <button onClick={() => { if (confirm(`Remove ${fl.name}?`)) deactivateFloor(fl.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Companies */}
        {tab === 'companies' && (
          <div className="flex flex-col gap-3">
            {companies.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No companies yet.</p>
            ) : companies.map((c: any) => (
              <div key={c.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
                    {c.building?.name || 'No building'} · {c._count?.tickets || 0} tickets
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal('editCompany', c)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>Edit</button>
                  <button onClick={() => { if (confirm(`Deactivate ${c.name}?`)) deactivateCompany(c.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FMs */}
        {tab === 'fms' && (
          <div className="flex flex-col gap-3">
            {fms.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No FM accounts yet.</p>
            ) : fms.map((u: any) => (
              <div key={u.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt2)' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
                    Last active: {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal('editFm', u)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>Edit</button>
                  <button onClick={() => { if (confirm(`Deactivate ${u.name}?`)) deactivateUser(u.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Building */}
      {showModal === 'addBuilding' && (
        <Modal title="Add Building" onClose={closeModal}>
          <Field label="Building Name *" value={f('name')} onChange={set('name')} placeholder="e.g. Canvas 144" />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => createBuilding(f('name')))}
            disabled={creatingBuilding || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingBuilding ? 'Creating...' : 'Create Building'}
          </button>
        </Modal>
      )}

      {/* Edit Building */}
      {showModal === 'editBuilding' && (
        <Modal title="Edit Building" onClose={closeModal}>
          <Field label="Building Name *" value={f('name')} onChange={set('name')} />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => updateBuilding({ id: selected.id, name: f('name') }))}
            disabled={updatingBuilding || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingBuilding ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {/* Add Floor */}
      {showModal === 'addFloor' && (
        <Modal title="Add Floor" onClose={closeModal}>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Building *</label>
            <select value={f('buildingId')} onChange={e => set('buildingId')(e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value=''>Select building</option>
              {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <Field label="Floor Name *" value={f('name')} onChange={set('name')} placeholder="e.g. Ground Floor, Floor 3" />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => createFloor({ buildingId: f('buildingId'), name: f('name') }))}
            disabled={creatingFloor || !f('buildingId') || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingFloor ? 'Creating...' : 'Create Floor'}
          </button>
        </Modal>
      )}

      {/* Edit Floor */}
      {showModal === 'editFloor' && (
        <Modal title="Edit Floor" onClose={closeModal}>
          <Field label="Floor Name *" value={f('name')} onChange={set('name')} />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => updateFloor({ id: selected.id, name: f('name') }))}
            disabled={updatingFloor || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingFloor ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {/* Add Company */}
      {showModal === 'addCompany' && (
        <Modal title="Add Company" onClose={closeModal}>
          <Field label="Company Name *" value={f('name')} onChange={set('name')} placeholder="e.g. TechCorp India" />
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Building</label>
            <select value={f('buildingId')} onChange={e => set('buildingId')(e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value=''>— Select building —</option>
              {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => createCompany({ name: f('name'), buildingId: f('buildingId') || undefined }))}
            disabled={creatingCompany || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingCompany ? 'Creating...' : 'Create Company'}
          </button>
        </Modal>
      )}

      {/* Edit Company */}
      {showModal === 'editCompany' && (
        <Modal title="Edit Company" onClose={closeModal}>
          <Field label="Company Name *" value={f('name')} onChange={set('name')} />
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Building</label>
            <select value={f('buildingId')} onChange={e => set('buildingId')(e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value=''>— Select building —</option>
              {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => updateCompany({ id: selected.id, name: f('name'), buildingId: f('buildingId') || undefined }))}
            disabled={updatingCompany || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingCompany ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {/* Add FM */}
      {showModal === 'addFm' && (
        <Modal title="Add Facility Manager" onClose={closeModal}>
          <Field label="Full Name *" value={f('name')} onChange={set('name')} />
          <Field label="Email *" value={f('email')} onChange={set('email')} type="email" />
          <Field label="Temporary Password *" value={f('password')} onChange={set('password')} type="password" />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => createUser({ name: f('name'), email: f('email'), password: f('password'), role: 'fm' }))}
            disabled={creatingUser || !f('name') || !f('email') || !f('password')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingUser ? 'Creating...' : 'Create FM'}
          </button>
        </Modal>
      )}

      {/* Edit FM */}
      {showModal === 'editFm' && (
        <Modal title="Edit FM" onClose={closeModal}>
          <Field label="Full Name *" value={f('name')} onChange={set('name')} />
          <Field label="Email" value={selected?.email || ''} onChange={() => {}} readOnly />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => updateUser({ id: selected.id, name: f('name') }))}
            disabled={updatingUser || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingUser ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}
    </div>
  )
}
