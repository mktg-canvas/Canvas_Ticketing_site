import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTickets } from '../../hooks/useTickets'
import { useCompanies } from '../../hooks/useCompanies'
import TicketCard from '../../components/tickets/TicketCard'

const STATUSES = ['all','open','acknowledged','in_progress','on_hold','resolved','closed']

export default function SuperAdminAllTickets() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [companyId, setCompanyId] = useState('')
  const { data, isLoading } = useTickets({ ...(status !== 'all' && { status }), ...(companyId && { companyId }) })
  const { data: companies = [] } = useCompanies()
  const tickets = data?.tickets || []

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0f1117' }}>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/superadmin/dashboard')} className="flex items-center gap-2 text-sm mb-5" style={{ color: '#8b92a5' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-semibold" style={{ color: '#e8eaf0' }}>All Tickets — Global</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#262c3a', color: '#8b92a5' }}>{data?.total || 0}</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize"
              style={{ background: status === s ? '#4f8ef7' : '#1f2330', color: status === s ? '#fff' : '#8b92a5', border: `1px solid ${status === s ? '#4f8ef7' : '#2e3545'}` }}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>

        <select value={companyId} onChange={e => setCompanyId(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-base outline-none border mb-5"
          style={{ background: '#262c3a', borderColor: '#2e3545', color: '#e8eaf0' }}>
          <option value=''>All companies</option>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {isLoading ? (
          <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="rounded-xl h-24 animate-pulse" style={{background:'#1f2330'}}/>)}</div>
        ) : tickets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: '#565e72' }}>No tickets found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tickets.map((t: any) => <TicketCard key={t.id} ticket={t} linkTo={`/superadmin/tickets/${t.id}`} />)}
          </div>
        )}
      </div>
    </div>
  )
}
