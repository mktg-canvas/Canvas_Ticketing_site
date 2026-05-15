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
import { useTickets } from '../../hooks/useTickets'
import { StatusBadge } from '../../components/tickets/StatusBadge'

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
  color?: string
  icon: React.ElementType
  clientN?: number
  cemN?: number
  isExpanded?: boolean
  activeSource?: 'client' | 'cem' | null
  onClick?: () => void
  onPillClick?: (source: 'client' | 'cem') => void
}
function StatCard({ label, value, color, icon: Icon, clientN, cemN, isExpanded, activeSource, onClick, onPillClick }: StatCardProps) {
  const clickable = !!onClick
  const hasSource = (clientN ?? 0) > 0 || (cemN ?? 0) > 0

  function sourcePill(text: string, c: string, src: 'client' | 'cem') {
    const isActive = activeSource === src
    return (
      <span
        onClick={e => { e.stopPropagation(); onPillClick?.(src) }}
        className="px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap"
        style={{
          color: c,
          borderColor: isActive ? c : `${c}40`,
          background: isActive ? `${c}28` : `${c}12`,
          boxShadow: isActive ? `0 0 0 1.5px ${c}` : 'none',
          cursor: onPillClick ? 'pointer' : 'default',
          transition: 'all .12s',
        }}
      >
        {text}
      </span>
    )
  }

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border flex flex-col overflow-hidden"
      style={{
        background: isExpanded ? 'var(--color-bg3)' : 'var(--color-bg1)',
        borderColor: isExpanded ? 'var(--color-accent)' : 'var(--color-bg4)',
        borderWidth: isExpanded ? 1.5 : 1,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={e => { if (clickable && !isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg2)' }}
      onMouseLeave={e => { if (clickable && !isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg1)' }}
    >
      {/* Header: icon + label + number */}
      <div className="px-3 pt-3 pb-2.5 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'var(--color-bg3)' }}>
          <Icon size={15} style={{ color: color || 'var(--color-txt2)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: 'var(--color-txt3)' }}>{label}</p>
          <p className="text-2xl sm:text-3xl font-bold leading-tight"
            style={{ color: color || 'var(--color-txt1)' }}>{value}</p>
        </div>
      </div>

      {/* Source pills row */}
      {hasSource && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid var(--color-bg4)' }}>
          {(clientN ?? 0) > 0 && sourcePill(`Client ${clientN}`, '#f97316', 'client')}
          {(cemN ?? 0) > 0 && sourcePill(`CEM ${cemN}`, '#06b6d4', 'cem')}
        </div>
      )}
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

function StackedBarShape(props: any) {
  const { x, y, width, height, fill, isTop } = props
  if (!height || height <= 0) return null
  const r = isTop ? Math.min(5, width / 2, height) : 0
  if (r === 0) return <rect x={x} y={y} width={width} height={height} fill={fill} />
  return (
    <path
      d={`M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`}
      fill={fill}
    />
  )
}

type EntityExpanded = { id: string; status?: string; source?: string } | null

function EntityCard({
  row, expanded, onCardClick, onPillClick,
}: {
  row: DimRow
  expanded: EntityExpanded
  onCardClick: () => void
  onPillClick: (extra: { status?: string; source?: string }) => void
}) {
  const isExpanded = expanded?.id === row.id
  const activeStatus = isExpanded ? expanded?.status : undefined
  const activeSource = isExpanded ? expanded?.source : undefined

  function pill(
    label: string,
    color: string,
    borderAlpha: string,
    bgAlpha: string,
    extra: { status?: string; source?: string },
  ) {
    const isActive = (extra.status && activeStatus === extra.status) ||
                     (extra.source && activeSource === extra.source)
    return (
      <span
        onClick={e => { e.stopPropagation(); onPillClick(isActive ? {} : extra) }}
        className="px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap cursor-pointer"
        style={{
          color,
          borderColor: isActive ? color : borderAlpha,
          background: isActive ? `${color}28` : bgAlpha,
          boxShadow: isActive ? `0 0 0 1.5px ${color}` : 'none',
          transition: 'all .12s',
        }}
      >
        {label}
      </span>
    )
  }

  return (
    <div
      onClick={onCardClick}
      className="shrink-0 rounded-2xl border cursor-pointer select-none flex flex-col"
      style={{
        width: 200,
        background: isExpanded ? 'var(--color-bg3)' : 'var(--color-bg0)',
        borderColor: isExpanded ? 'var(--color-accent)' : 'var(--color-bg4)',
        borderWidth: isExpanded ? 1.5 : 1,
        transition: 'border-color .15s, background .15s',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg2)' }}
      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg0)' }}
    >
      {/* Name + total */}
      <div className="px-3 pt-3 pb-2.5">
        <p className="text-xs font-extrabold truncate mb-1.5" style={{ color: 'var(--color-txt1)' }}>{row.name}</p>
        <p className="text-2xl font-bold leading-none" style={{ color: 'var(--color-txt1)' }}>{row.total}</p>
      </div>

      {/* Status line */}
      <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--color-bg4)' }}>
        {pill(`${row.open} Open`,    '#ef4444', '#ef444440', '#ef444412', { status: 'open' })}
        {pill(`${row.in_progress} IP`, '#f59e0b', '#f59e0b40', '#f59e0b12', { status: 'in_progress' })}
        {pill(`${row.closed} Closed`, '#10b981', '#10b98140', '#10b98112', { status: 'closed' })}
      </div>

      {/* Source line */}
      <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--color-bg4)' }}>
        {pill(`Client ${row.client_total}`, '#f97316', '#f9731640', '#f9731612', { source: 'client' })}
        {pill(`CEM ${row.cem_total}`,       '#06b6d4', '#06b6d440', '#06b6d412', { source: 'cem' })}
      </div>
    </div>
  )
}

const ENTITY_SINGULAR: Record<string, string> = { CEMs: 'CEM', Clients: 'Client', Buildings: 'Building' }

function EntityCardRow({
  label, rows, expanded, onExpand, isLoading, filterKey, extraFilters,
}: {
  label: string
  rows: DimRow[]
  expanded: EntityExpanded
  onExpand: (v: EntityExpanded) => void
  isLoading: boolean
  filterKey: 'cemId' | 'clientId' | 'buildingId'
  extraFilters: Record<string, string | undefined>
}) {
  const expandedRow = expanded ? (rows.find(r => r.id === expanded.id) ?? null) : null

  const drilldownLabel = expandedRow ? [
    expandedRow.name,
    expanded?.status === 'open' ? 'Open' : expanded?.status === 'in_progress' ? 'In Progress' : expanded?.status === 'closed' ? 'Closed' : null,
    expanded?.source === 'client' ? 'Client Reported' : expanded?.source === 'cem' ? 'CEM Observed' : null,
  ].filter(Boolean).join(' · ') : ''

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--color-bg4)' }}>
        <p className="text-sm font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-txt1)' }}>{label}</p>
        {!isLoading && rows.length > 0 && (
          <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>{rows.length} {rows.length === 1 ? (ENTITY_SINGULAR[label] ?? label) : label}</p>
        )}
      </div>
      {isLoading ? (
        <div className="px-3 py-3 flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shrink-0 rounded-2xl h-36 w-44 animate-pulse" style={{ background: 'var(--color-bg3)' }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-xs" style={{ color: 'var(--color-txt3)' }}>No data in this period</p>
        </div>
      ) : (
        <div className="px-3 py-3 flex gap-3 overflow-x-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-bg4) transparent' }}>
          {rows.map(row => (
            <EntityCard
              key={row.id}
              row={row}
              expanded={expanded}
              onCardClick={() => onExpand(expanded?.id === row.id ? null : { id: row.id })}
              onPillClick={extra => onExpand(Object.keys(extra).length ? { id: row.id, ...extra } : { id: row.id })}
            />
          ))}
        </div>
      )}
      {expandedRow && (
        <DrilldownPanel
          label={drilldownLabel}
          filters={{
            [filterKey]: expandedRow.id,
            ...(expanded?.status && { status: expanded.status }),
            ...(expanded?.source && { source: expanded.source }),
            ...extraFilters,
          }}
          onClose={() => onExpand(null)}
        />
      )}
    </div>
  )
}

function fmtShort(date?: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function getCategoryName(category: any): string {
  if (!category) return ''
  if (typeof category === 'string') return category.replace(/_/g, ' ')
  return category.name
}

const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  client: { label: 'Client Reported', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  cem:    { label: 'CEM Observed',    bg: 'rgba(6,182,212,0.15)',  color: '#06b6d4' },
}

interface DrilldownState {
  label: string
  filters: Record<string, string | undefined>
}

function DrilldownPanel({
  label,
  filters,
  onClose,
}: {
  label: string
  filters: Record<string, string | undefined>
  onClose: () => void
}) {
  const navigate = useNavigate()
  const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
  const { data, isLoading } = useTickets(cleanFilters)
  const tickets = (data as any)?.tickets ?? []
  const total = (data as any)?.total ?? 0

  return (
    <div className="border-t" style={{ borderColor: 'var(--color-bg4)' }}>
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3"
        style={{ borderBottom: `1px solid var(--color-bg4)` }}>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--color-txt1)' }}>{label}</p>
          {!isLoading && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-txt3)' }}>
              {total} ticket{total !== 1 ? 's' : ''}{total > 20 ? ' · showing first 20' : ''}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full shrink-0"
          style={{ color: 'var(--color-txt3)', background: 'var(--color-bg3)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg4)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-bg3)')}
        >
          <X size={13} />
        </button>
      </div>
      {isLoading ? (
        <div className="px-4 py-4 flex flex-col gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--color-bg3)' }} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-txt3)' }}>No tickets match this selection</p>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-2.5">
          {tickets.map((ticket: any) => {
            const category = getCategoryName(ticket.category)
            const badge = SOURCE_BADGE[ticket.source]
            const isOverdue = ticket.status === 'open' && ticket.opened_at
              && (Date.now() - new Date(ticket.opened_at).getTime()) > 24 * 3_600_000
            return (
              <div
                key={ticket.id}
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                className="rounded-2xl border cursor-pointer relative px-4 py-3"
                style={{
                  background: 'var(--color-bg0)',
                  borderColor: isOverdue ? '#ef4444' : 'var(--color-bg4)',
                  borderWidth: isOverdue ? 1.5 : 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-bg0)')}
              >
                {isOverdue && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#ef4444' }} />
                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: '#ef4444' }} />
                  </span>
                )}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    {/* Line 1: number + priority + status + category + source */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <span className="text-xs font-bold shrink-0" style={{ color: 'var(--color-txt1)' }}>
                        #{ticket.ticket_number}
                      </span>
                      {ticket.is_priority && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--color-danger)', color: '#fff' }}>P</span>
                      )}
                      <StatusBadge status={ticket.status} />
                      {category && (
                        <span className="text-xs capitalize" style={{ color: 'var(--color-txt2)' }}>
                          {category}
                        </span>
                      )}
                      {badge && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full font-medium"
                          style={{ background: badge.bg, color: badge.color, fontSize: 10 }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    {/* Line 2: building + floor + client pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {ticket.building?.name && (
                        <span className="px-2 py-0.5 rounded-full border"
                          style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt3)', fontSize: 10 }}>
                          {ticket.building.name}
                        </span>
                      )}
                      {ticket.floor?.name && (
                        <span className="px-2 py-0.5 rounded-full border"
                          style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt3)', fontSize: 10 }}>
                          {ticket.floor.name}
                        </span>
                      )}
                      {ticket.client?.name && (
                        <span className="px-2 py-0.5 rounded-full border"
                          style={{ background: 'var(--color-bg3)', borderColor: 'var(--color-bg4)', color: 'var(--color-txt3)', fontSize: 10 }}>
                          {ticket.client.name}
                        </span>
                      )}
                    </div>
                    {/* Line 3: sub_category or description */}
                    {(ticket.sub_category || ticket.description) && (
                      <p className="truncate text-[11px]" style={{ color: 'var(--color-txt3)' }}>
                        {ticket.sub_category || ticket.description}
                      </p>
                    )}
                  </div>
                  {/* Right: status timestamps — min-w so text never clips */}
                  <div className="flex flex-col gap-1 shrink-0 items-end justify-center" style={{ minWidth: 96 }}>
                    {ticket.opened_at && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#ef4444' }} />
                        <span className="whitespace-nowrap" style={{ color: 'var(--color-txt3)', fontSize: 10 }}>{fmtShort(ticket.opened_at)}</span>
                      </div>
                    )}
                    {ticket.in_progress_at && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#f59e0b' }} />
                        <span className="whitespace-nowrap" style={{ color: 'var(--color-txt3)', fontSize: 10 }}>{fmtShort(ticket.in_progress_at)}</span>
                      </div>
                    )}
                    {ticket.closed_at && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#22c55e' }} />
                        <span className="whitespace-nowrap" style={{ color: 'var(--color-txt3)', fontSize: 10 }}>{fmtShort(ticket.closed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const chartRef = useRef<HTMLDivElement>(null)
  const drilldownRef = useRef<HTMLDivElement>(null)
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
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null)
  const [expandedCem, setExpandedCem] = useState<EntityExpanded>(null)
  const [expandedClient, setExpandedClient] = useState<EntityExpanded>(null)
  const [expandedBuilding, setExpandedBuilding] = useState<EntityExpanded>(null)
  const [expandedKpi, setExpandedKpi] = useState<{ status: 'open' | 'in_progress' | 'closed'; source?: 'client' | 'cem' } | null>(null)

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

  const entityExtraFilters = useMemo<Record<string, string | undefined>>(() => ({
    ...(dateRange.from && { from: dateRange.from }),
    ...(dateRange.to   && { to:   dateRange.to }),
    ...(source !== 'all' && { source }),
  }), [dateRange, source])

  useEffect(() => { setDrilldown(null) }, [dimension])
  useEffect(() => { setExpandedCem(null); setExpandedClient(null); setExpandedBuilding(null); setExpandedKpi(null) }, [filters])

  function openDrilldown(rowData: any, dataKey: string) {
    const KEY_MAP: Record<string, { status?: string; barSource?: string }> = {
      total_open:      { status: 'open' },
      total_inprog:    { status: 'in_progress' },
      total_closed:    { status: 'closed' },
      client_open:     { status: 'open',        barSource: 'client' },
      client_inprog:   { status: 'in_progress', barSource: 'client' },
      client_closed:   { status: 'closed',      barSource: 'client' },
      cem_open:        { status: 'open',        barSource: 'cem' },
      cem_inprog:      { status: 'in_progress', barSource: 'cem' },
      cem_closed:      { status: 'closed',      barSource: 'cem' },
      Open:            { status: 'open' },
      'In Progress':   { status: 'in_progress' },
      Closed:          { status: 'closed' },
    }
    const { status, barSource } = KEY_MAP[dataKey] ?? {}
    const f: Record<string, string | undefined> = {}

    if (dateRange.from) f.from = dateRange.from
    if (dateRange.to) f.to = dateRange.to

    if (buildingId && dimension !== 'byBuilding') f.buildingId = buildingId
    if (clientId && dimension !== 'byClient') f.clientId = clientId
    if (categoryId && dimension !== 'byCategory') f.category = categoryId
    if (cemId && dimension !== 'byCem') f.cemId = cemId

    if (dimension === 'byBuilding') f.buildingId = rowData._id
    else if (dimension === 'byClient') f.clientId = rowData._id
    else if (dimension === 'byCategory') f.category = rowData._id
    else if (dimension === 'byCem') f.cemId = rowData._id
    else if (dimension === 'bySource') f.source = rowData._id
    else if (dimension === 'byMonth' && rowData._month) {
      const [y, m] = rowData._month.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      f.from = new Date(`${rowData._month}-01T00:00:00`).toISOString()
      f.to = new Date(`${rowData._month}-${String(lastDay).padStart(2, '0')}T23:59:59`).toISOString()
    }

    if (barSource) f.source = barSource
    else if (source !== 'all' && dimension !== 'bySource') f.source = source

    if (status) f.status = status

    const statusLabel = status === 'in_progress' ? 'In Progress'
      : status === 'open' ? 'Open'
      : status === 'closed' ? 'Closed'
      : undefined
    const labelParts: string[] = [rowData.name]
    if (statusLabel) labelParts.push(statusLabel)
    if (barSource) labelParts.push(barSource === 'client' ? 'Client Reported' : 'CEM Observed')

    setDrilldown({ label: labelParts.join(' · '), filters: f })
    setTimeout(() => drilldownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

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
  const cems = allUsers

  const chartData = useMemo(() => {
    if (!data) return []
    const rows = data[dimension] as (DimRow | MonthRow)[]
    return rows.map(r => ({
      name: dimension === 'byMonth' ? fmtMonth((r as MonthRow).month) : (r as DimRow).name,
      _id:    dimension === 'byMonth' ? undefined : (r as DimRow).id,
      _month: dimension === 'byMonth' ? (r as MonthRow).month : undefined,
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(() => {
                const clientRow = data.bySource.find((r: any) => r.id === 'client')
                const cemRow    = data.bySource.find((r: any) => r.id === 'cem')
                return (
                  <>
                    <StatCard label="Total Tickets" value={data.summary.total} icon={Ticket}
                      clientN={clientRow?.total ?? 0} cemN={cemRow?.total ?? 0} />
                    {(['open', 'in_progress', 'closed'] as const).map(st => {
                      const isExp = expandedKpi?.status === st
                      const cfg = {
                        open:        { label: 'Open',        value: data.summary.open,        color: COLORS.open,   icon: AlertCircle,  clientN: clientRow?.open        ?? 0, cemN: cemRow?.open        ?? 0 },
                        in_progress: { label: 'In Progress', value: data.summary.in_progress, color: COLORS.inProg, icon: TrendingUp,   clientN: clientRow?.in_progress ?? 0, cemN: cemRow?.in_progress ?? 0 },
                        closed:      { label: 'Closed',      value: data.summary.closed,      color: COLORS.closed, icon: CheckCircle, clientN: clientRow?.closed      ?? 0, cemN: cemRow?.closed      ?? 0 },
                      }[st]
                      return (
                        <StatCard key={st} {...cfg}
                          isExpanded={isExp}
                          activeSource={isExp ? (expandedKpi?.source ?? null) : null}
                          onClick={() => setExpandedKpi(isExp && !expandedKpi?.source ? null : { status: st })}
                          onPillClick={src => setExpandedKpi(
                            isExp && expandedKpi?.source === src ? { status: st } : { status: st, source: src }
                          )}
                        />
                      )
                    })}
                    <StatCard label="Avg Resolution" value={fmtHours(data.summary.avgResolutionHours)} icon={Clock} />
                  </>
                )
              })()}
            </div>
            {expandedKpi && (
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
                <DrilldownPanel
                  label={[
                    expandedKpi.status === 'open' ? 'Open' : expandedKpi.status === 'in_progress' ? 'In Progress' : 'Closed',
                    expandedKpi.source === 'client' ? 'Client Reported' : expandedKpi.source === 'cem' ? 'CEM Observed' : null,
                  ].filter(Boolean).join(' · ') + ' Tickets'}
                  filters={{ ...filters, status: expandedKpi.status, ...(expandedKpi.source && { source: expandedKpi.source }) }}
                  onClose={() => setExpandedKpi(null)}
                />
              </div>
            )}
          </>
        ) : null}

        {/* Entity card rows */}
        <EntityCardRow
          label="CEMs"
          rows={data?.byCem ?? []}
          expanded={expandedCem}
          onExpand={setExpandedCem}
          isLoading={isLoading}
          filterKey="cemId"
          extraFilters={entityExtraFilters}
        />
        <EntityCardRow
          label="Clients"
          rows={data?.byClient ?? []}
          expanded={expandedClient}
          onExpand={setExpandedClient}
          isLoading={isLoading}
          filterKey="clientId"
          extraFilters={entityExtraFilters}
        />
        <EntityCardRow
          label="Buildings"
          rows={data?.byBuilding ?? []}
          expanded={expandedBuilding}
          onExpand={setExpandedBuilding}
          isLoading={isLoading}
          filterKey="buildingId"
          extraFilters={entityExtraFilters}
        />

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
              <FilterSelect value={cemId} onChange={setCemId} placeholder="All Raisers">
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
                          <Bar dataKey="Open" stackId="a" fill={COLORS.open} style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'Open')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.open}   isTop={!p['In Progress'] && !p.Closed} />} />
                          <Bar dataKey="In Progress" stackId="a" fill={COLORS.inProg} style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'In Progress')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.inProg} isTop={!p.Closed} />} />
                          <Bar dataKey="Closed" stackId="a" fill={COLORS.closed} style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'Closed')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.closed} isTop={true} />} />
                        </>
                      ) : (
                        <>
                          <Bar dataKey="total_open"   stackId="total"  fill={COLORS.open}   name="Open"        style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'total_open')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.open}   isTop={!p.total_inprog  && !p.total_closed}  />} />
                          <Bar dataKey="total_inprog" stackId="total"  fill={COLORS.inProg} name="In Progress" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'total_inprog')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.inProg} isTop={!p.total_closed}  />} />
                          <Bar dataKey="total_closed" stackId="total"  fill={COLORS.closed} name="Closed"      style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'total_closed')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.closed} isTop={true} />} />
                          <Bar dataKey="client_open"   stackId="client" fill={COLORS.open}   name="Open"        legendType="none" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'client_open')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.open}   isTop={!p.client_inprog && !p.client_closed} />} />
                          <Bar dataKey="client_inprog" stackId="client" fill={COLORS.inProg} name="In Progress" legendType="none" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'client_inprog')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.inProg} isTop={!p.client_closed} />} />
                          <Bar dataKey="client_closed" stackId="client" fill={COLORS.closed} name="Closed"      legendType="none" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'client_closed')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.closed} isTop={true} />} />
                          <Bar dataKey="cem_open"   stackId="cem" fill={COLORS.open}   name="Open"        legendType="none" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'cem_open')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.open}   isTop={!p.cem_inprog && !p.cem_closed} />} />
                          <Bar dataKey="cem_inprog" stackId="cem" fill={COLORS.inProg} name="In Progress" legendType="none" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'cem_inprog')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.inProg} isTop={!p.cem_closed} />} />
                          <Bar dataKey="cem_closed" stackId="cem" fill={COLORS.closed} name="Closed"      legendType="none" style={{ cursor: 'pointer' }} onClick={(d) => openDrilldown(d, 'cem_closed')}
                            shape={(p: any) => <StackedBarShape {...p} fill={COLORS.closed} isTop={true} />} />
                        </>
                      )}
                    </BarChart>
                  )
                })()}
              </ResponsiveContainer>
            ) : dimension === 'bySource' ? (
              <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
                  style={{ cursor: 'pointer' }}
                  onClick={(state: any) => {
                    if (!state?.activeLabel) return
                    const row = chartData.find(r => r.name === state.activeLabel)
                    if (row) openDrilldown(row, '')
                  }}
                >
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
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
                        style={{ cursor: 'pointer' }}
                        onClick={(state: any) => {
                          if (!state?.activeLabel) return
                          const row = chartData.find(r => r.name === state.activeLabel)
                          if (row) openDrilldown(row, '')
                        }}
                      >
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

          {/* Drilldown panel */}
          {drilldown && (
            <div ref={drilldownRef}>
              <DrilldownPanel
                label={drilldown.label}
                filters={drilldown.filters}
                onClose={() => setDrilldown(null)}
              />
            </div>
          )}

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
                    <tr key={i} style={{ borderBottom: `1px solid var(--color-bg4)`, cursor: 'pointer' }}
                      onClick={() => {
                        const cd = chartData.find(r => r.name === row.name)
                        if (cd) openDrilldown(cd, '')
                      }}
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
