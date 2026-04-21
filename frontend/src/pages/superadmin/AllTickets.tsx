import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTickets, useDeleteTicket } from '../../hooks/useTickets'
import { useBuildings } from '../../hooks/useBuildings'
import { useCompanies } from '../../hooks/useCompanies'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = ['all', 'open', 'in_progress', 'closed']

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
  const { mutate: rawDelete } = useDeleteTicket()
  const [failedId, setFailedId] = useState<string | null>(null)
  const [failedMsg, setFailedMsg] = useState('')

  function deleteTicket(id: string) {
    setFailedId(null)
    rawDelete(id, {
      onError: (err: any) => {
        setFailedId(id)
        setFailedMsg(err.response?.data?.error || 'Delete failed')
      },
    })
  }

  const selStyle = { background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--color-bg0)' }}>
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
        <button onClick={() => navigate('/superadmin/dashboard')}><ArrowLeft size={20} style={{ color: 'var(--color-txt2)' }} /></button>
        <h1 className="text-sm font-semibold" style={{ color: 'var(--color-txt1)' }}>All Tickets</h1>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}>{data?.total || 0}</span>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-3">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors"
              style={{
                background: status === s ? 'var(--color-accent)' : 'var(--color-bg2)',
                color: status === s ? '#fff' : 'var(--color-txt2)',
                border: `1px solid ${status === s ? 'var(--color-accent)' : 'var(--color-bg4)'}`,
              }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Building + Company filters */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <select value={buildingId} onChange={e => setBuildingId(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm outline-none border" style={selStyle}>
            <option value=''>All buildings</option>
            {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={companyId} onChange={e => setCompanyId(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm outline-none border" style={selStyle}>
            <option value=''>All companies</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: 'var(--color-bg2)' }} />)}</div>
        ) : tickets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--color-txt3)' }}>No tickets found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t: any) => (
              <TicketCard key={t.id} ticket={t} linkTo={`/superadmin/tickets/${t.id}`}
                onDelete={deleteTicket}
                deleteError={failedId === t.id ? failedMsg : null} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
