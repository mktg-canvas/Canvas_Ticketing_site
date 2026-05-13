import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X, Building2, Layers, Briefcase, UserCheck } from 'lucide-react'
import SuperAdminNav from '../../components/shared/SuperAdminNav'
import { isAxiosError } from 'axios'
import { useBuildings, useCreateBuilding, useUpdateBuilding, useDeactivateBuilding } from '../../hooks/useBuildings'
import { useFloors, useCreateFloor, useUpdateFloor, useDeactivateFloor } from '../../hooks/useFloors'
import { useClients, useCreateClient, useUpdateClient, useDeactivateClient, useAddClientLocation, useRemoveClientLocation } from '../../hooks/useClients'
import type { ClientLocation } from '../../types'
import { useUsers, useCreateUser, useDeactivateUser, useUpdateUser } from '../../hooks/useUsers'

const TABS = [
  { key: 'buildings', label: 'Buildings', icon: Building2 },
  { key: 'floors', label: 'Floors', icon: Layers },
  { key: 'clients', label: 'Clients', icon: Briefcase },
  { key: 'cems', label: 'CEMs', icon: UserCheck },
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
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'buildings')
  const [showModal, setShowModal] = useState<string | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [pendingLocations, setPendingLocations] = useState<Array<{ buildingId: string; buildingName: string; floorId: string; floorName: string }>>([])
  const [editLocations, setEditLocations] = useState<ClientLocation[]>([])

  const f = (key: string) => form[key] || ''
  const set = (key: string) => (v: string) => setForm(prev => ({ ...prev, [key]: v }))

  const { data: buildings = [] } = useBuildings()
  const { data: floors = [] } = useFloors()
  const { data: clients = [] } = useClients()
  const { data: users = [] } = useUsers()
  const cems = users.filter((u: any) => u.role === 'cem')

  const { mutateAsync: createBuilding, isPending: creatingBuilding } = useCreateBuilding()
  const { mutateAsync: updateBuilding, isPending: updatingBuilding } = useUpdateBuilding()
  const { mutateAsync: deactivateBuilding } = useDeactivateBuilding()

  const { mutateAsync: createFloor, isPending: creatingFloor } = useCreateFloor()
  const { mutateAsync: updateFloor, isPending: updatingFloor } = useUpdateFloor()
  const { mutateAsync: deactivateFloor } = useDeactivateFloor()

  const { mutateAsync: createClient, isPending: creatingClient } = useCreateClient()
  const { mutateAsync: updateClient, isPending: updatingClient } = useUpdateClient()
  const { mutateAsync: deactivateClient } = useDeactivateClient()
  const { mutateAsync: addClientLocation, isPending: addingLocation } = useAddClientLocation()
  const { mutateAsync: removeClientLocation } = useRemoveClientLocation()

  const { mutateAsync: createUser, isPending: creatingUser } = useCreateUser()
  const { mutateAsync: deactivateUser } = useDeactivateUser()
  const { mutateAsync: updateUser, isPending: updatingUser } = useUpdateUser()

  function openModal(type: string, item?: any) {
    setError('')
    setPendingLocations([])
    setSelected(item || null)
    if (item) {
      if (type === 'editBuilding') setForm({ name: item.name })
      if (type === 'editFloor') setForm({ name: item.name, buildingId: item.building_id })
      if (type === 'editClient') { setForm({ name: item.name }); setEditLocations(item.locations || []) }
      if (type === 'editCem') setForm({ name: item.name })
    } else {
      setForm({})
      setEditLocations([])
    }
    setShowModal(type)
  }

  function closeModal() { setShowModal(null); setSelected(null); setForm({}); setError(''); setPendingLocations([]); setEditLocations([]) }

  async function handleAddPendingLocation() {
    const building = buildings.find((b: any) => b.id === f('locBuildingId'))
    const floor = floors.find((fl: any) => fl.id === f('locFloorId'))
    if (!building || !floor) return
    if (pendingLocations.some(l => l.buildingId === f('locBuildingId') && l.floorId === f('locFloorId'))) return
    setPendingLocations(prev => [...prev, { buildingId: building.id, buildingName: building.name, floorId: floor.id, floorName: floor.name }])
    setForm(prev => ({ ...prev, locBuildingId: '', locFloorId: '' }))
  }

  async function handleAddEditLocation() {
    if (!selected) return
    setError('')
    try {
      const loc = await addClientLocation({ clientId: selected.id, buildingId: f('locBuildingId'), floorId: f('locFloorId') })
      setEditLocations(prev => [...prev, loc])
      setForm(prev => ({ ...prev, locBuildingId: '', locFloorId: '' }))
    } catch (e: unknown) {
      if (isAxiosError(e)) setError(e.response?.data?.error || 'Failed to add location')
      else setError('Failed to add location')
    }
  }

  async function handleRemoveEditLocation(locationId: string) {
    if (!selected) return
    setError('')
    try {
      await removeClientLocation({ clientId: selected.id, locationId })
      setEditLocations(prev => prev.filter(l => l.id !== locationId))
    } catch (e: unknown) {
      if (isAxiosError(e)) setError(e.response?.data?.error || 'Failed to remove location')
      else setError('Failed to remove location')
    }
  }

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

  const addLabel = tab === 'buildings' ? 'Building' : tab === 'floors' ? 'Floor' : tab === 'clients' ? 'Client' : 'CEM'
  const addModalKey = tab === 'buildings' ? 'addBuilding' : tab === 'floors' ? 'addFloor' : tab === 'clients' ? 'addClient' : 'addCem'

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg0)' }}>
      <SuperAdminNav />

      {/* Add button row */}
      <div className="px-4 pb-3 max-w-2xl mx-auto flex justify-end">
        <button onClick={() => openModal(addModalKey)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}>
          <Plus size={15} /> Add {addLabel}
        </button>
      </div>

      <div className="p-4 pt-0 max-w-2xl mx-auto">
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

        {/* Clients */}
        {tab === 'clients' && (
          <div className="flex flex-col gap-3">
            {clients.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No clients yet.</p>
            ) : clients.map((c: any) => (
              <div key={c.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
                    {c.locations?.length === 0
                      ? 'No location'
                      : c.locations?.length === 1
                        ? `${c.locations[0].building.name} · ${c.locations[0].floor.name}`
                        : (() => {
                            const uniqueBuildings = [...new Set(c.locations.map((l: ClientLocation) => l.building_id))]
                            return uniqueBuildings.length > 1
                              ? `${uniqueBuildings.length} buildings · ${c.locations.length} floors`
                              : `${c.locations[0].building.name} · ${c.locations.length} floors`
                          })()
                    } · {c._count?.tickets || 0} tickets
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal('editClient', c)}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)', color: 'var(--color-accent)' }}>Edit</button>
                  <button onClick={() => { if (confirm(`Deactivate ${c.name}?`)) deactivateClient(c.id) }}
                    className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CEMs */}
        {tab === 'cems' && (
          <div className="flex flex-col gap-3">
            {cems.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--color-txt3)' }}>No CEM accounts yet.</p>
            ) : cems.map((u: any) => (
              <div key={u.id} className="rounded-xl p-4 border flex items-center justify-between" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>{u.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt2)' }}>{u.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
                    Last active: {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal('editCem', u)}
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

      {/* Add Client */}
      {showModal === 'addClient' && (
        <Modal title="Add Client" onClose={closeModal}>
          <Field label="Client Name *" value={f('name')} onChange={set('name')} placeholder="e.g. TechCorp India" />
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-txt2)' }}>Locations</label>
            {pendingLocations.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                {pendingLocations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-txt2)' }}>{loc.buildingName} · {loc.floorName}</span>
                    <button onClick={() => setPendingLocations(prev => prev.filter((_, j) => j !== i))}>
                      <X size={12} style={{ color: 'var(--color-txt3)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select value={f('locBuildingId')} onChange={e => { set('locBuildingId')(e.target.value); set('locFloorId')('') }}
                className="flex-1 rounded-lg px-2 py-2 text-sm outline-none border" style={inputStyle}>
                <option value=''>Building</option>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={f('locFloorId')} onChange={e => set('locFloorId')(e.target.value)}
                disabled={!f('locBuildingId')}
                className="flex-1 rounded-lg px-2 py-2 text-sm outline-none border" style={{ ...inputStyle, opacity: f('locBuildingId') ? 1 : 0.5 }}>
                <option value=''>Floor</option>
                {floors.filter((fl: any) => fl.building_id === f('locBuildingId')).map((fl: any) => (
                  <option key={fl.id} value={fl.id}>{fl.name}</option>
                ))}
              </select>
              <button onClick={handleAddPendingLocation} disabled={!f('locBuildingId') || !f('locFloorId')}
                className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 shrink-0"
                style={{ background: 'var(--color-accent)', color: '#fff' }}>
                Add
              </button>
            </div>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(async () => {
            const client = await createClient({ name: f('name') })
            for (const loc of pendingLocations) {
              await addClientLocation({ clientId: client.id, buildingId: loc.buildingId, floorId: loc.floorId })
            }
          })}
            disabled={creatingClient || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingClient ? 'Creating...' : 'Create Client'}
          </button>
        </Modal>
      )}

      {/* Edit Client */}
      {showModal === 'editClient' && (
        <Modal title="Edit Client" onClose={closeModal}>
          <Field label="Client Name *" value={f('name')} onChange={set('name')} />
          <div className="mb-3">
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-txt2)' }}>Locations</label>
            {editLocations.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                {editLocations.map((l: ClientLocation) => (
                  <div key={l.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-bg3)' }}>
                    <span className="text-xs" style={{ color: 'var(--color-txt2)' }}>{l.building.name} · {l.floor.name}</span>
                    <button onClick={() => handleRemoveEditLocation(l.id)}>
                      <X size={12} style={{ color: 'var(--color-txt3)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select value={f('locBuildingId')} onChange={e => { set('locBuildingId')(e.target.value); set('locFloorId')('') }}
                className="flex-1 rounded-lg px-2 py-2 text-sm outline-none border" style={inputStyle}>
                <option value=''>Building</option>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={f('locFloorId')} onChange={e => set('locFloorId')(e.target.value)}
                disabled={!f('locBuildingId')}
                className="flex-1 rounded-lg px-2 py-2 text-sm outline-none border" style={{ ...inputStyle, opacity: f('locBuildingId') ? 1 : 0.5 }}>
                <option value=''>Floor</option>
                {floors.filter((fl: any) => fl.building_id === f('locBuildingId')).map((fl: any) => (
                  <option key={fl.id} value={fl.id}>{fl.name}</option>
                ))}
              </select>
              <button onClick={handleAddEditLocation} disabled={!f('locBuildingId') || !f('locFloorId') || addingLocation}
                className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 shrink-0"
                style={{ background: 'var(--color-accent)', color: '#fff' }}>
                Add
              </button>
            </div>
          </div>
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => updateClient({ id: selected.id, name: f('name') }))}
            disabled={updatingClient || !f('name')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {updatingClient ? 'Saving...' : 'Save Changes'}
          </button>
        </Modal>
      )}

      {/* Add CEM */}
      {showModal === 'addCem' && (
        <Modal title="Add CEM" onClose={closeModal}>
          <Field label="Full Name *" value={f('name')} onChange={set('name')} />
          <Field label="Email *" value={f('email')} onChange={set('email')} type="email" />
          <Field label="Temporary Password *" value={f('password')} onChange={set('password')} type="password" />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button onClick={() => run(() => createUser({ name: f('name'), email: f('email'), password: f('password'), role: 'cem' }))}
            disabled={creatingUser || !f('name') || !f('email') || !f('password')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            {creatingUser ? 'Creating...' : 'Create CEM'}
          </button>
        </Modal>
      )}

      {/* Edit CEM */}
      {showModal === 'editCem' && (
        <Modal title="Edit CEM" onClose={closeModal}>
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
