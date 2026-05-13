import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart2, LineChart as LineChartIcon, TrendingUp, Clock, CheckCircle, Ticket,
  AlertCircle, ChevronDown, Calendar, SlidersHorizontal, X, Download, Loader2,
} from 'lucide-react'
import AdminNav from '../../components/shared/AdminNav'
import html2canvas from 'html2canvas'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { useAnalytics, type DimRow, type MonthRow } from '../../hooks/useAnalytics'
import { useBuildings } from '../../hooks/useBuildings'
import { useClients } from '../../hooks/useClients'
import { useCategories } from '../../hooks/useCategories'
import { useUsers } from '../../hooks/useUsers'
import { useAuthStore } from '../../store/authStore'

type DatePreset = '7d' | '30d' | '90d' | 'all' | 'custom'
type Dimension = 'byBuilding' | 'byCategory' | 'byClient' | 'byCem' | 'byMonth' | 'bySource'
type ChartType = 'bar' | 'line'

const COLORS = {
  open:    '#ef4444',
  inProg:  '#f59e0b',
  closed:  '#10b981',
  total:   '#6366f1',
  client:  '#f97316',
  cem:     '#06b6d4',
  gridLn:  '#e5e7eb',
  axisTxt: '#6b7280',
}

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d',     label: '7 Days' },
  { value: '30d',    label: '30 Days' },
  { value: '90d',    label: '90 Days' },
  { value: 'all',    label: 'All Time' },
  { value: 'custom', label: 'Custom' },
]

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'byCem',      label: 'CEM' },
  { value: 'byBuilding', label: 'Building' },
  { value: 'byCategory', label: 'Issue Category' },
  { value: 'byClient',   label: 'Client' },
  { value: 'byMonth',    label: 'Monthly Trend' },
  { value: 'bySource',   label: 'Source' },
]

function computeRange(preset: DatePreset, customFrom: string, customTo: string): { from?: string; to?: string } {
  const now = new Date()
  const to = now.toISOString()
  if (preset === 'all') return {}
  if (preset === 'custom') {
    return {
      from: customFrom ? new Date(customFrom).toISOString() : undefined,
      to: customTo ? new Date(customTo + 'T23:59:59').toISOString() : undefined,
    }
  }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const from = new Date(now)
  from.setDate(from.getDate() - days)
  from.setHours(0, 0, 0, 0)
  return { from: from.toISOString(), to }
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

function fmtMonth(iso: string) {
  const [y, m] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}

function fmtHours(h: number | null) {
  if (h == null) return '—'
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon: React.ElementType
}
function StatCard({ label, value, sub, color, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl p-3 sm:p-4 border flex items-start gap-2.5 sm:gap-3 min-h-[80px] sm:min-h-[88px]"
      style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-bg3)' }}>
        <Icon size={15} style={{ color: color || 'var(--color-txt2)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs mb-0.5 truncate" style={{ color: 'var(--color-txt3)' }}>{label}</p>
        <p className="text-xl sm:text-2xl font-bold leading-tight"
          style={{ color: color || 'var(--color-txt1)' }}>{value}</p>
        {sub && <p className="text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: 'var(--color-txt3)' }}>{sub}</p>}
      </div>
    </div>
  )
}

interface FilterSelectProps {
  value: string
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
}
function FilterSelect({ value, onChange, placeholder, children }: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none rounded-lg px-3 pr-8 text-xs outline-none border h-9 cursor-pointer w-full"
        style={{
          background: 'var(--color-bg1)',
          borderColor: value ? 'var(--color-accent)' : 'var(--color-bg4)',
          color: value ? 'var(--color-txt1)' : 'var(--color-txt3)',
          minWidth: 140,
        }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-txt3)' }} />
    </div>
  )
}

function makeGroupTick(offset: number) {
  return ({ x, y, payload }: any) => (
    <g transform={`translate(${x},${y})`}>
      <text y={10} textAnchor="middle" fontSize={11} fill={COLORS.axisTxt}>
        {payload.value}
      </text>
      <text x={-offset} y={24} textAnchor="middle" fontSize={8} fontWeight={700} fill={COLORS.total}>Total</text>
      <text x={0}        y={24} textAnchor="middle" fontSize={8} fontWeight={700} fill={COLORS.client}>Client</text>
      <text x={offset}   y={24} textAnchor="middle" fontSize={8} fontWeight={700} fill={COLORS.cem}>CEM</text>
    </g>
  )
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
  return (
    <div className="rounded-xl border p-3 shadow-lg text-xs"
      style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
      <p className="font-bold mb-2" style={{ color: 'var(--color-txt1)' }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color ?? p.fill }} />
          <span style={{ color: 'var(--color-txt2)' }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--color-txt1)' }}>{p.value}</span>
        </div>
      ))}
      <div className="border-t mt-1.5 pt-1.5" style={{ borderColor: 'var(--color-bg4)' }}>
        <span style={{ color: 'var(--color-txt3)' }}>Total: </span>
        <span className="font-bold" style={{ color: 'var(--color-txt1)' }}>{total}</span>
      </div>
    </div>
  )
}

const GroupedSourceTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  type G = { open: number; inprog: number; closed: number }
  const g: Record<string, G> = {
    total:  { open: 0, inprog: 0, closed: 0 },
    client: { open: 0, inprog: 0, closed: 0 },
    cem:    { open: 0, inprog: 0, closed: 0 },
  }
  for (const p of payload) {
    const k = p.dataKey as string
    if      (k === 'total_open')    g.total.open    = p.value
    else if (k === 'total_inprog')  g.total.inprog  = p.value
    else if (k === 'total_closed')  g.total.closed  = p.value
    else if (k === 'client_open')   g.client.open   = p.value
    else if (k === 'client_inprog') g.client.inprog = p.value
    else if (k === 'client_closed') g.client.closed = p.value
    else if (k === 'cem_open')      g.cem.open      = p.value
    else if (k === 'cem_inprog')    g.cem.inprog    = p.value
    else if (k === 'cem_closed')    g.cem.closed    = p.value
  }
  const sections = [
    { key: 'total',  label: 'Total',           color: COLORS.total },
    { key: 'client', label: 'Client Reported',  color: COLORS.client },
    { key: 'cem',    label: 'CEM Observed',     color: COLORS.cem },
  ]
  return (
    <div className="rounded-xl border p-3 shadow-lg text-xs"
      style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)', minWidth: 180 }}>
      <p className="font-bold mb-2.5" style={{ color: 'var(--color-txt1)' }}>{label}</p>
      {sections.map(({ key, label: sLabel, color }) => {
        const v = g[key]
        const t = v.open + v.inprog + v.closed
        return (
          <div key={key} className="mb-2">
            <div className="flex items-center justify-between gap-3 mb-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
                <span className="font-semibold" style={{ color }}>{sLabel}</span>
              </span>
              <span className="font-bold" style={{ color: 'var(--color-txt1)' }}>{t}</span>
            </div>
            <div className="pl-3.5 flex flex-col gap-0.5">
              {([
                { s: 'Open',        val: v.open,   c: COLORS.open },
                { s: 'In Progress', val: v.inprog, c: COLORS.inProg },
                { s: 'Closed',      val: v.closed, c: COLORS.closed },
              ] as const).filter(x => x.val > 0).map(({ s, val, c }) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                  <span style={{ color: 'var(--color-txt3)' }}>{s}:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-txt1)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState(todayStr())
  const [customTo, setCustomTo] = useState(todayStr())
  const [dimension, setDimension] = useState<Dimension>('byCem')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [showFilters, setShowFilters] = useState(false)
  const [buildingId, setBuildingId] = useState('')
  const [clientId, setClientId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [cemId, setCemId] = useState('')
  const [source, setSource] = useState<'all' | 'client' | 'cem'>('all')

  const dateRange = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  )
  const filters = useMemo(() => ({
    ...dateRange,
    ...(buildingId && { buildingId }),
    ...(clientId && { clientId }),
    ...(categoryId && { categoryId }),
    ...(cemId && { cemId }),
    ...(source !== 'all' && { source }),
  }), [dateRange, buildingId, clientId, categoryId, cemId, source])
  const hasFilter = !!(buildingId || clientId || categoryId || cemId)

  const accessToken = useAuthStore(s => s.accessToken)
  const { data, isLoading, isError, error, refetch } = useAnalytics(filters)

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  const { data: buildings = [] } = useBuildings()
  const { data: clients = [] } = useClients()
  const { data: categories = [] } = useCategories()
  const { data: allUsers = [] } = useUsers()
  const cems = allUsers.filter((u: any) => u.role === 'cem')

  const chartData = useMemo(() => {
    if (!data) return []
    const rows = data[dimension] as (DimRow | MonthRow)[]
    return rows.map(r => ({
      name: dimension === 'byMonth' ? fmtMonth((r as MonthRow).month) : (r as DimRow).name,
      // bySource tab: stacked by status
      Open: r.open,
      'In Progress': r.in_progress,
      Closed: r.closed,
      // line chart: totals per source
      Total:             r.total,
      'Client Reported': r.client_total,
      'CEM Observed':    r.cem_total,
      // grouped+stacked bar chart: per-source status breakdown
      total_open:    r.open,
      total_inprog:  r.in_progress,
      total_closed:  r.closed,
      client_open:   r.open_client,
      client_inprog: r.in_progress_client,
      client_closed: r.closed_client,
      cem_open:      r.open_cem,
      cem_inprog:    r.in_progress_cem,
      cem_closed:    r.closed_cem,
      _total: r.total,
    }))
  }, [data, dimension])

  const tableRows = useMemo(() => {
    if (!data) return []
    const rows = data[dimension] as (DimRow | MonthRow)[]
    return rows.map(r => ({
      name: dimension === 'byMonth' ? fmtMonth((r as MonthRow).month) : (r as DimRow).name,
      open: r.open,
      in_progress: r.in_progress,
      closed: r.closed,
      total: r.total,
      pctClosed: r.total > 0 ? Math.round((r.closed / r.total) * 100) : 0,
    }))
  }, [data, dimension])

  // Summary cards for Source dimension
  const sourceRows = useMemo(() => {
    if (!data?.bySource) return null
    const client = data.bySource.find(r => r.id === 'client')
    const cem = data.bySource.find(r => r.id === 'cem')
    return { client, cem }
  }, [data])

  const dimLabel = DIMENSIONS.find(d => d.value === dimension)?.label ?? ''
  const DIM_NOUN: Record<string, string> = {
    byCem:      'CEM',
    byBuilding: 'building',
    byCategory: 'issue category',
    byClient:   'client',
    byMonth:    'month',
    bySource:   'source',
  }
  const dimNoun = DIM_NOUN[dimension] ?? 'item'
  const totalTickets = tableRows.reduce((s, r) => s + r.total, 0)
  const activeDateLabel = preset === 'custom'
    ? `${customFrom} → ${customTo}`
    : PRESETS.find(p => p.value === preset)?.label

  function clearFilters() {
    setBuildingId(''); setClientId(''); setCategoryId(''); setCemId(''); setSource('all')
  }

  async function downloadPDF() {
    if (!data) return
    setIsExporting(true)
    try {
      // Capture just the chart as an image
      let chartImageUrl: string | undefined
      if (chartRef.current && chartData.length > 0) {
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg1').trim() || '#ffffff'
        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: bg,
          logging: false,
        })
        chartImageUrl = canvas.toDataURL('image/png')
      }

      // Build active filter labels
      const activeFilters: string[] = []
      if (buildingId) activeFilters.push(`Building: ${buildings.find((b: any) => b.id === buildingId)?.name ?? buildingId}`)
      if (clientId)   activeFilters.push(`Client: ${clients.find((c: any) => c.id === clientId)?.name ?? clientId}`)
      if (categoryId) activeFilters.push(`Category: ${categories.find((c: any) => c.id === categoryId)?.name ?? categoryId}`)
      if (cemId)      activeFilters.push(`CEM: ${cems.find((u: any) => u.id === cemId)?.name ?? cemId}`)

      const [{ pdf }, { AnalyticsReportPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../components/shared/AnalyticsReportPDF'),
      ])
      const blob = await pdf(
        <AnalyticsReportPDF
          summary={data.summary}
          tableRows={tableRows}
          dimLabel={dimLabel}
          dateLabel={activeDateLabel ?? ''}
          chartImageUrl={chartImageUrl}
          generatedAt={new Date().toLocaleString('en-IN')}
          activeFilters={activeFilters}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `canvas-analytics-${dimension}-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--color-bg0)' }}>
      <AdminNav />

      <div className="max-w-6xl mx-auto p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">

        {/* Date range bar */}
        <div className="rounded-2xl border p-3 flex flex-wrap items-center gap-2"
          style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <span className="text-xs font-semibold px-1" style={{ color: 'var(--color-txt3)' }}>
            Period
          </span>
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: preset === p.value ? 'var(--color-accent)' : 'var(--color-bg3)',
                color: preset === p.value ? '#fff' : 'var(--color-txt2)',
              }}
            >
              {p.value === 'custom' && <Calendar size={12} />}
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <input type="date" value={customFrom} max={customTo || todayStr()}
                onChange={e => setCustomFrom(e.target.value)}
                className="rounded-lg px-3 text-xs outline-none border h-8"
                style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }} />
              <span className="text-xs" style={{ color: 'var(--color-txt3)' }}>to</span>
              <input type="date" value={customTo} min={customFrom} max={todayStr()}
                onChange={e => setCustomTo(e.target.value)}
                className="rounded-lg px-3 text-xs outline-none border h-8"
                style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt1)' }} />
            </div>
          )}
        </div>

        {/* Source toggle */}
        <div className="rounded-2xl border p-3 flex items-center gap-2 flex-wrap"
          style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <span className="text-xs font-semibold px-1" style={{ color: 'var(--color-txt3)' }}>Source</span>
          {([
            { value: 'all',    label: 'All Tickets' },
            { value: 'client', label: 'Client Reported' },
            { value: 'cem',    label: 'CEM Observed' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setSource(opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: source === opt.value
                  ? opt.value === 'client' ? 'var(--color-warning)'
                  : opt.value === 'cem'    ? 'var(--color-accent)'
                  :                          'var(--color-accent)'
                  : 'var(--color-bg3)',
                color: source === opt.value ? '#fff' : 'var(--color-txt2)',
              }}
            >
              {opt.label}
            </button>
          ))}
          {source !== 'all' && (
            <span className="ml-auto text-xs" style={{ color: 'var(--color-txt3)' }}>
              Showing {source === 'client' ? 'client-reported' : 'CEM-observed'} tickets only
            </span>
          )}
        </div>

        {/* Not-authenticated banner */}
        {!accessToken && (
          <div className="rounded-2xl border p-4 flex items-center justify-between gap-3"
            style={{ background: 'var(--bg-warning-15)', borderColor: 'var(--color-warning)' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
                Not authenticated. Please log in again to load analytics data.
              </p>
            </div>
            <button onClick={() => { navigate('/login') }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--color-warning)', color: '#fff' }}>
              Log in
            </button>
          </div>
        )}

        {/* Error banner */}
        {isError && (
          <div className="rounded-2xl border p-4 flex items-center justify-between gap-3"
            style={{ background: 'var(--bg-danger-10)', borderColor: 'var(--color-danger)' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                {(error as any)?.response?.status === 401
                  ? 'Session expired — please log in again.'
                  : `Failed to load analytics: ${(error as any)?.message || 'Unknown error'}`}
              </p>
            </div>
            <button onClick={() => refetch()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--color-danger)', color: '#fff' }}>
              Retry
            </button>
          </div>
        )}

        {/* KPI row */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl h-[88px] animate-pulse border"
                style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)' }} />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Tickets" value={data.summary.total} icon={Ticket} />
            <StatCard label="Open" value={data.summary.open} color={COLORS.open} icon={AlertCircle}
              sub={data.summary.total > 0 ? `${Math.round((data.summary.open / data.summary.total) * 100)}%` : undefined} />
            <StatCard label="In Progress" value={data.summary.in_progress} color={COLORS.inProg} icon={TrendingUp}
              sub={data.summary.total > 0 ? `${Math.round((data.summary.in_progress / data.summary.total) * 100)}%` : undefined} />
            <StatCard label="Closed" value={data.summary.closed} color={COLORS.closed} icon={CheckCircle}
              sub={data.summary.total > 0 ? `${Math.round((data.summary.closed / data.summary.total) * 100)}%` : undefined} />
            <StatCard label="Avg Resolution" value={fmtHours(data.summary.avgResolutionHours)} icon={Clock}
              sub="open → closed" />
          </div>
        ) : null}

        {/* Dimension tabs */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <div className="flex items-center justify-between gap-2 px-2 border-b overflow-x-auto"
            style={{ borderColor: 'var(--color-bg4)' }}>
            <div className="flex items-center gap-1 py-1">
              {DIMENSIONS.map(d => {
                const active = dimension === d.value
                return (
                  <button
                    key={d.value}
                    onClick={() => setDimension(d.value)}
                    className="px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap border-b-2"
                    style={{
                      color: active ? 'var(--color-accent)' : 'var(--color-txt3)',
                      borderBottomColor: active ? 'var(--color-accent)' : 'transparent',
                      marginBottom: -1,
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold mr-1 shrink-0"
              style={{
                background: hasFilter ? 'var(--bg-accent-15)' : 'transparent',
                color: hasFilter ? 'var(--color-accent)' : 'var(--color-txt3)',
              }}>
              <SlidersHorizontal size={12} />
              {hasFilter ? `Filtered` : 'Filter'}
              <ChevronDown size={12}
                style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
            </button>
          </div>

          {/* Filter row (collapsed by default) */}
          {showFilters && (
            <div className="px-4 py-3 border-b flex flex-wrap gap-2 items-center"
              style={{ borderColor: 'var(--color-bg4)', background: 'var(--color-bg2)' }}>
              <FilterSelect value={buildingId} onChange={setBuildingId} placeholder="All Buildings">
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </FilterSelect>
              <FilterSelect value={clientId} onChange={setClientId} placeholder="All Clients">
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FilterSelect>
              <FilterSelect value={categoryId} onChange={setCategoryId} placeholder="All Categories">
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FilterSelect>
              <FilterSelect value={cemId} onChange={setCemId} placeholder="All CEMs">
                {cems.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </FilterSelect>
              {hasFilter && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 px-3 h-9 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Source summary cards (shown only for Source dimension) */}
          {dimension === 'bySource' && sourceRows && (
            <div className="px-4 py-3 border-b grid grid-cols-2 gap-3" style={{ borderColor: 'var(--color-bg4)' }}>
              {[
                { key: 'client', label: 'Client Reported', color: 'var(--color-warning)', row: sourceRows.client },
                { key: 'cem',    label: 'CEM Observed',    color: 'var(--color-accent)',  row: sourceRows.cem },
              ].map(({ label, color, row }) => (
                <div key={label} className="rounded-xl p-3 border" style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-txt1)' }}>{row?.total ?? 0}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-txt3)' }}>
                    {row && data?.summary.total ? Math.round((row.total / data.summary.total) * 100) : 0}% of total
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Chart header — title + chart-type toggle + export */}
          <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap"
            style={{ borderColor: 'var(--color-bg4)' }}>
            <div className="min-w-0">
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-txt1)' }}>
                Tickets by {dimLabel}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
                {activeDateLabel}
                {hasFilter && ' · filtered'}
                {!isLoading && ` · ${totalTickets} tickets across ${tableRows.length} ${tableRows.length === 1 ? dimNoun : dimNoun + 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Chart-type toggle */}
              <div
                data-html2canvas-ignore
                className="flex items-center gap-0.5 p-0.5 rounded-lg border"
                style={{ background: 'var(--color-bg2)', borderColor: 'var(--color-bg4)' }}
                role="group"
                aria-label="Chart type"
              >
                {([
                  { value: 'bar',  label: 'Bar',  Icon: BarChart2 },
                  { value: 'line', label: 'Line', Icon: LineChartIcon },
                ] as const).map(opt => {
                  const active = chartType === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setChartType(opt.value)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                      aria-pressed={active}
                      style={{
                        background: active ? 'var(--color-accent)' : 'transparent',
                        color: active ? '#fff' : 'var(--color-txt2)',
                      }}
                    >
                      <opt.Icon size={12} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              {!isLoading && tableRows.length > 0 && (
                <button
                  data-html2canvas-ignore
                  onClick={downloadPDF}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 disabled:opacity-60"
                  style={{ background: 'var(--color-bg3)', color: 'var(--color-txt2)' }}
                  title="Download PDF report"
                >
                  {isExporting
                    ? <><Loader2 size={13} className="animate-spin" />Exporting…</>
                    : <><Download size={13} />Export PDF</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Chart */}
          <div ref={chartRef} className="px-2 pt-4 pb-2">
            {isLoading ? (
              <div className="h-60 sm:h-72 mx-3 rounded-xl animate-pulse"
                style={{ background: 'var(--color-bg3)' }} />
            ) : chartData.length === 0 ? (
              <div className="h-60 sm:h-72 flex flex-col items-center justify-center gap-2">
                <BarChart2 size={28} style={{ color: 'var(--color-txt3)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-txt2)' }}>
                  No tickets in this period
                </p>
                <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>
                  Try adjusting the date range or filters
                </p>
              </div>
            ) : chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height={isMobile ? 240 : 320}>
                {(() => {
                  const grouped = dimension !== 'bySource'
                  const barOff  = isMobile ? 18 : 22
                  const useTick = grouped && chartData.length <= 8
                  return (
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
                      barCategoryGap="28%" barSize={isMobile ? 14 : 18}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLn} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={useTick ? makeGroupTick(barOff) : { fontSize: 11, fill: COLORS.axisTxt }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={!useTick && chartData.length > 6 ? -30 : 0}
                        textAnchor={!useTick && chartData.length > 6 ? 'end' : 'middle'}
                        height={useTick ? 44 : chartData.length > 6 ? 70 : 30}
                      />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.axisTxt }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={grouped ? <GroupedSourceTooltip /> : <ChartTooltip />} cursor={{ fill: '#000', opacity: 0.04 }} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        iconType="square"
                        iconSize={10}
                        formatter={(value) => <span style={{ color: 'var(--color-txt2)' }}>{value}</span>}
                      />
                      {!grouped ? (
                        <>
                          <Bar dataKey="Open"        stackId="a" fill={COLORS.open}   radius={[0, 0, 0, 0]} />
                          <Bar dataKey="In Progress" stackId="a" fill={COLORS.inProg} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Closed"      stackId="a" fill={COLORS.closed} radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <>
                          <Bar dataKey="total_open"    stackId="total"  fill={COLORS.open}   radius={[0, 0, 0, 0]} name="Open"        />
                          <Bar dataKey="total_inprog"  stackId="total"  fill={COLORS.inProg} radius={[0, 0, 0, 0]} name="In Progress" />
                          <Bar dataKey="total_closed"  stackId="total"  fill={COLORS.closed} radius={[4, 4, 0, 0]} name="Closed"       />
                          <Bar dataKey="client_open"   stackId="client" fill={COLORS.open}   radius={[0, 0, 0, 0]} name="Open"        legendType="none" />
                          <Bar dataKey="client_inprog" stackId="client" fill={COLORS.inProg} radius={[0, 0, 0, 0]} name="In Progress" legendType="none" />
                          <Bar dataKey="client_closed" stackId="client" fill={COLORS.closed} radius={[4, 4, 0, 0]} name="Closed"       legendType="none" />
                          <Bar dataKey="cem_open"      stackId="cem"    fill={COLORS.open}   radius={[0, 0, 0, 0]} name="Open"        legendType="none" />
                          <Bar dataKey="cem_inprog"    stackId="cem"    fill={COLORS.inProg} radius={[0, 0, 0, 0]} name="In Progress" legendType="none" />
                          <Bar dataKey="cem_closed"    stackId="cem"    fill={COLORS.closed} radius={[4, 4, 0, 0]} name="Closed"       legendType="none" />
                        </>
                      )}
                    </BarChart>
                  )
                })()}
              </ResponsiveContainer>
            ) : dimension === 'bySource' ? (
              <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLn} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.axisTxt }} tickLine={false} axisLine={false} interval={0} angle={chartData.length > 6 ? -30 : 0} textAnchor={chartData.length > 6 ? 'end' : 'middle'} height={chartData.length > 6 ? 70 : 30} />
                  <YAxis tick={{ fontSize: 11, fill: COLORS.axisTxt }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="line" iconSize={14} formatter={(v) => <span style={{ color: 'var(--color-txt2)' }}>{v}</span>} />
                  <Line type="linear" dataKey="Open"        stroke={COLORS.open}   strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="linear" dataKey="In Progress" stroke={COLORS.inProg} strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="linear" dataKey="Closed"      stroke={COLORS.closed} strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col gap-4 px-2 pb-3">
                {([
                  {
                    title: 'By Source',
                    lines: [
                      { key: 'Total',           color: COLORS.total },
                      { key: 'Client Reported', color: COLORS.client },
                      { key: 'CEM Observed',    color: COLORS.cem },
                    ],
                  },
                  {
                    title: 'By Status',
                    lines: [
                      { key: 'Open',        color: COLORS.open },
                      { key: 'In Progress', color: COLORS.inProg },
                      { key: 'Closed',      color: COLORS.closed },
                    ],
                  },
                ] as const).map(panel => (
                  <div key={panel.title}>
                    <p className="text-xs font-semibold text-center mb-1" style={{ color: 'var(--color-txt2)' }}>
                      {panel.title}
                    </p>
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLn} vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.axisTxt }} tickLine={false} axisLine={false} interval={0} angle={chartData.length > 5 ? -30 : 0} textAnchor={chartData.length > 5 ? 'end' : 'middle'} height={chartData.length > 5 ? 60 : 24} />
                        <YAxis tick={{ fontSize: 10, fill: COLORS.axisTxt }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} iconType="line" iconSize={12} formatter={(v) => <span style={{ color: 'var(--color-txt2)' }}>{v}</span>} />
                        {panel.lines.map(l => (
                          <Line key={l.key} type="linear" dataKey={l.key} stroke={l.color} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          {!isLoading && tableRows.length > 0 && (
            <div className="border-t overflow-x-auto" style={{ borderColor: 'var(--color-bg4)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--color-bg2)', borderBottom: `1px solid var(--color-bg4)` }}>
                    {[dimLabel, 'Open', 'In Progress', 'Closed', 'Total', '% Closed'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-txt3)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid var(--color-bg4)` }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-txt1)' }}>{row.name}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: COLORS.open }}>{row.open}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: COLORS.inProg }}>{row.in_progress}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: COLORS.closed }}>{row.closed}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-txt1)' }}>{row.total}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'var(--color-bg3)', minWidth: 40 }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${row.pctClosed}%`, background: COLORS.closed }} />
                          </div>
                          <span className="shrink-0 font-semibold" style={{ color: 'var(--color-txt2)' }}>
                            {row.pctClosed}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tableRows.length > 1 && (() => {
                    const tot = tableRows.reduce((acc, r) => ({
                      open: acc.open + r.open,
                      in_progress: acc.in_progress + r.in_progress,
                      closed: acc.closed + r.closed,
                      total: acc.total + r.total,
                    }), { open: 0, in_progress: 0, closed: 0, total: 0 })
                    const pct = tot.total > 0 ? Math.round((tot.closed / tot.total) * 100) : 0
                    return (
                      <tr style={{ background: 'var(--color-bg2)', borderTop: `2px solid var(--color-bg4)` }}>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-txt1)' }}>Total</td>
                        <td className="px-4 py-3 font-bold" style={{ color: COLORS.open }}>{tot.open}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: COLORS.inProg }}>{tot.in_progress}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: COLORS.closed }}>{tot.closed}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-txt1)' }}>{tot.total}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-txt1)' }}>{pct}%</td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
