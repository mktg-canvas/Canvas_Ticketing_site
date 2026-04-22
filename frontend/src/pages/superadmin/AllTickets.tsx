import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useBuildings } from '../../hooks/useBuildings'
import { useCompanies } from '../../hooks/useCompanies'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = [
  { value: 'all',         label: 'All' },
  { value: 'open',        label: 'Open',        color: 'var(--color-danger)' },
  { value: 'in_progress', label: 'In Progress',  color: 'var(--color-warning)' },
  { value: 'closed',      label: 'Closed',       color: 'var(--color-success)' },
]

function FilterSelect({ value, onChange, placeholder, children }: {
  value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode
}) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl px-3 pr-8 text-xs outline-none border"
        style={{
          background: 'var(--color-bg1)',
          borderColor: 'var(--color-bg4)',
          color: value ? 'var(--color-txt1)' : 'var(--color-txt3)',
          height: 38,
          cursor: 'pointer',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
      >
        <option value=''>{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-txt3)' }} />
    </div>
  )
}

export default function SuperAdminAllTickets() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [buildingId, setBuildingId] = useState('')
  const [companyId, setCompanyId] = useState('')

  const { data, isLoading } = useTickets({
    ...(status !== 'all' && { status }),
    ...(buildingId && { buildingId }),
    ...(companyId && { companyId }),
  })
  const { data: buildings = [] } = useBuildings()
  const { data: companies = [] } = useCompanies()
  const tickets = data?.tickets || []

  const hasFilters = buildingId || companyId

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg0)' }}>
      <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/superadmin/dashboard')}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>All Tickets</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt3)' }}>
            {data?.total ?? 0}
          </span>
        </div>

        {/* Status filter tabs */}
        <div className="flex border-t" style={{ borderColor: 'var(--color-bg4)' }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className="flex-1 py-2.5 text-xs font-semibold relative transition-colors"
              style={{ color: status === s.value ? (s.color || 'var(--color-accent)') : 'var(--color-txt3)' }}
            >
              {s.label}
              {status === s.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: s.color || 'var(--color-accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2 mb-5">
          <FilterSelect value={buildingId} onChange={setBuildingId} placeholder="All buildings">
            {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </FilterSelect>
          <FilterSelect value={companyId} onChange={setCompanyId} placeholder="All companies">
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          {hasFilters && (
            <button
              onClick={() => { setBuildingId(''); setCompanyId('') }}
              className="px-3 rounded-xl text-xs font-medium shrink-0 border"
              style={{ borderColor: 'var(--color-bg4)', color: 'var(--color-txt3)', background: 'var(--color-bg1)' }}
            >
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm font-medium" style={{ color: 'var(--color-txt2)' }}>No tickets found</p>
            <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t: any) => (
              <TicketCard
                key={t.id}
                ticket={t}
                linkTo={`/superadmin/tickets/${t.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
