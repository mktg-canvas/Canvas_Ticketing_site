import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const OPEN   = '#ef4444'
const PROG   = '#f59e0b'
const CLOSED = '#10b981'
const ACCENT = '#6366f1'
const CLIENT = '#f97316'
const CEM    = '#06b6d4'
const GREY1  = '#111827'
const GREY2  = '#374151'
const GREY3  = '#6b7280'
const GREY4  = '#9ca3af'
const BG1    = '#f9fafb'
const BG2    = '#f3f4f6'
const BORDER = '#e5e7eb'
const BORDER2 = '#d1d5db'

function fmtHours(h: number | null) {
  if (h == null) return '—'
  if (h < 1) return `${Math.round(h * 60)}m`
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export interface ReportSummary {
  total: number
  open: number
  in_progress: number
  closed: number
  avgResolutionHours: number | null
}

export interface FullReportRow {
  name: string
  open: number
  in_progress: number
  closed: number
  total: number
  client_total: number
  cem_total: number
  pctClosed: number
}

export interface ReportSection {
  label: string
  rows: FullReportRow[]
}

// Kept for backwards compatibility — not used internally
export interface ReportRow {
  name: string
  open: number
  in_progress: number
  closed: number
  total: number
  pctClosed: number
}

interface Props {
  summary: ReportSummary
  allSections: ReportSection[]
  dateLabel: string
  chartImageUrl?: string
  generatedAt: string
  activeFilters: string[]
}

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 36,
    fontSize: 10,
    color: GREY1,
    backgroundColor: '#ffffff',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: 'solid',
  },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: GREY1 },
  brandSub:  { fontSize: 8,  color: GREY4, marginTop: 3 },
  headerMeta: { alignItems: 'flex-end' },
  metaRow:   { flexDirection: 'row', alignItems: 'baseline', marginBottom: 3 },
  metaLabel: { fontSize: 7, color: GREY4, marginRight: 6 },
  metaValue: { fontSize: 8, color: GREY2, fontFamily: 'Helvetica-Bold' },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GREY4,
    letterSpacing: 1,
    marginBottom: 8,
  },

  // ── KPI row ───────────────────────────────────────────────────────────────
  kpiRow: { flexDirection: 'row', marginBottom: 22 },
  kpiCard: {
    flex: 1,
    marginRight: 7,
    backgroundColor: BG1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
  },
  kpiCardLast: { marginRight: 0 },
  kpiLabel: { fontSize: 7, color: GREY3, marginBottom: 3 },
  kpiValue: { fontSize: 19, fontFamily: 'Helvetica-Bold' },
  kpiSub:   { fontSize: 7, color: GREY4, marginTop: 2 },

  // ── Chart ─────────────────────────────────────────────────────────────────
  chartSection: { marginBottom: 24 },
  chartImage: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
  },

  // ── Entity card grid ──────────────────────────────────────────────────────
  entitySection: { marginBottom: 20 },
  entitySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: 'solid',
  },
  entitySectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GREY1 },
  entitySectionCount: { fontSize: 8, color: GREY4 },
  entityGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  entityCard: {
    width: '31%',
    marginRight: '3.5%',
    marginBottom: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: BORDER,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    padding: 8,
  },
  entityCardName:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREY1, marginBottom: 3 },
  entityCardTotal: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: GREY1, marginBottom: 6 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableSection: { marginBottom: 24 },
  tHead: {
    flexDirection: 'row',
    backgroundColor: BG2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tSubHead: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
  },
  tRowAlt: { backgroundColor: BG1 },
  tTotals: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: BG2,
    borderWidth: 1,
    borderTopWidth: 2,
    borderTopColor: BORDER2,
    borderColor: BORDER,
    borderStyle: 'solid',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  cName:   { flex: 2.5 },
  cStat:   { flex: 1, textAlign: 'right' },
  cSrc:    { flex: 1, textAlign: 'right' },
  cPct:    { flex: 1.2, textAlign: 'right' },
  th:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREY3, letterSpacing: 0.5 },
  td:      { fontSize: 8.5, color: GREY2 },
  tdBold:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: GREY1 },
  tdSmall: { fontSize: 7.5, color: GREY3 },

  srcLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopStyle: 'solid',
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: GREY4 },
})

// ── Shared header/footer ───────────────────────────────────────────────────

function PageHeader({ dateLabel, generatedAt, activeFilters }: {
  dateLabel: string
  generatedAt: string
  activeFilters: string[]
}) {
  return (
    <View style={S.header}>
      <View>
        <Text style={S.brandName}>Canvas</Text>
        <Text style={S.brandSub}>Analytics & Reports</Text>
      </View>
      <View style={S.headerMeta}>
        <View style={S.metaRow}>
          <Text style={S.metaLabel}>Period</Text>
          <Text style={S.metaValue}>{dateLabel}</Text>
        </View>
        <View style={S.metaRow}>
          <Text style={S.metaLabel}>Generated</Text>
          <Text style={S.metaValue}>{generatedAt}</Text>
        </View>
        {activeFilters.length > 0 && (
          <View style={S.metaRow}>
            <Text style={S.metaLabel}>Filters</Text>
            <Text style={S.metaValue}>{activeFilters.join('  ·  ')}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function PageFooter() {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>Canvas Workspace  ·  Confidential</Text>
      <Text
        style={S.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}

// ── Entity card components ─────────────────────────────────────────────────

function PillBadge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: color + '55',
      backgroundColor: color + '1a',
      marginRight: 3,
      marginBottom: 3,
    }}>
      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color }}>{text}</Text>
    </View>
  )
}

function EntityCardPDF({ row }: { row: FullReportRow }) {
  return (
    <View style={S.entityCard}>
      <Text style={S.entityCardName}>{row.name}</Text>
      <Text style={S.entityCardTotal}>{row.total}</Text>
      <View style={S.pillsRow}>
        <PillBadge text={`${row.open} Open`}    color={OPEN}   />
        <PillBadge text={`${row.in_progress} IP`} color={PROG} />
        <PillBadge text={`${row.closed} Closed`} color={CLOSED} />
      </View>
      <View style={S.pillsRow}>
        <PillBadge text={`Client ${row.client_total}`} color={CLIENT} />
        <PillBadge text={`CEM ${row.cem_total}`}       color={CEM}    />
      </View>
    </View>
  )
}

function EntityCardSection({ title, rows }: { title: string; rows: FullReportRow[] }) {
  if (rows.length === 0) return null
  const noun = title === 'CEMs' ? 'CEM' : title === 'Clients' ? 'Client' : 'Building'
  return (
    <View style={S.entitySection}>
      <View style={S.entitySectionHeader}>
        <Text style={S.entitySectionTitle}>{title}</Text>
        <Text style={S.entitySectionCount}>{rows.length} {rows.length === 1 ? noun : title}</Text>
      </View>
      <View style={S.entityGrid}>
        {rows.map((row, i) => (
          <EntityCardPDF key={i} row={row} />
        ))}
      </View>
    </View>
  )
}

// ── Dimension breakdown table ──────────────────────────────────────────────

function SectionTable({ section }: { section: ReportSection }) {
  const { label, rows } = section
  const totals = rows.reduce(
    (acc, r) => ({
      open: acc.open + r.open,
      in_progress: acc.in_progress + r.in_progress,
      closed: acc.closed + r.closed,
      total: acc.total + r.total,
      client_total: acc.client_total + r.client_total,
      cem_total: acc.cem_total + r.cem_total,
    }),
    { open: 0, in_progress: 0, closed: 0, total: 0, client_total: 0, cem_total: 0 }
  )
  const totalPct = totals.total > 0 ? Math.round((totals.closed / totals.total) * 100) : 0

  return (
    <View style={S.tableSection}>
      <Text style={S.sectionLabel}>{label.toUpperCase()}</Text>

      <View style={S.tHead}>
        <Text style={[S.th, S.cName]}>{label}</Text>
        <Text style={[S.th, S.cStat]}>Open</Text>
        <Text style={[S.th, S.cStat]}>In Prog</Text>
        <Text style={[S.th, S.cStat]}>Closed</Text>
        <Text style={[S.th, S.cStat]}>Total</Text>
        <Text style={[S.th, S.cSrc, { color: CLIENT }]}>Client</Text>
        <Text style={[S.th, S.cSrc, { color: CEM }]}>CEM</Text>
        <Text style={[S.th, S.cPct]}>% Done</Text>
      </View>

      {rows.map((row, i) => (
        <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
          <Text style={[S.tdBold, S.cName]}>{row.name}</Text>
          <Text style={[S.td, S.cStat, { color: OPEN   }]}>{row.open}</Text>
          <Text style={[S.td, S.cStat, { color: PROG   }]}>{row.in_progress}</Text>
          <Text style={[S.td, S.cStat, { color: CLOSED }]}>{row.closed}</Text>
          <Text style={[S.tdBold, S.cStat]}>{row.total}</Text>
          <Text style={[S.td, S.cSrc, { color: CLIENT }]}>{row.client_total}</Text>
          <Text style={[S.td, S.cSrc, { color: CEM    }]}>{row.cem_total}</Text>
          <Text style={[S.tdBold, S.cPct, { color: CLOSED }]}>{row.pctClosed}%</Text>
        </View>
      ))}

      {rows.length > 1 && (
        <View style={S.tTotals}>
          <Text style={[S.tdBold, S.cName]}>Total</Text>
          <Text style={[S.tdBold, S.cStat, { color: OPEN   }]}>{totals.open}</Text>
          <Text style={[S.tdBold, S.cStat, { color: PROG   }]}>{totals.in_progress}</Text>
          <Text style={[S.tdBold, S.cStat, { color: CLOSED }]}>{totals.closed}</Text>
          <Text style={[S.tdBold, S.cStat]}>{totals.total}</Text>
          <Text style={[S.tdBold, S.cSrc, { color: CLIENT }]}>{totals.client_total}</Text>
          <Text style={[S.tdBold, S.cSrc, { color: CEM    }]}>{totals.cem_total}</Text>
          <Text style={[S.tdBold, S.cPct, { color: CLOSED }]}>{totalPct}%</Text>
        </View>
      )}
    </View>
  )
}

// ── Main document ──────────────────────────────────────────────────────────

export function AnalyticsReportPDF({
  summary, allSections, dateLabel,
  chartImageUrl, generatedAt, activeFilters,
}: Props) {
  const kpis = [
    { label: 'Total Tickets',   value: String(summary.total),       color: GREY1  },
    { label: 'Open',            value: String(summary.open),        color: OPEN,
      sub: summary.total > 0 ? `${Math.round((summary.open / summary.total) * 100)}% of total` : undefined },
    { label: 'In Progress',     value: String(summary.in_progress), color: PROG,
      sub: summary.total > 0 ? `${Math.round((summary.in_progress / summary.total) * 100)}% of total` : undefined },
    { label: 'Closed',          value: String(summary.closed),      color: CLOSED,
      sub: summary.total > 0 ? `${Math.round((summary.closed / summary.total) * 100)}% of total` : undefined },
    { label: 'Avg Resolution',  value: fmtHours(summary.avgResolutionHours), color: ACCENT, sub: 'open to closed' },
  ]

  // Extract entity rows from sections (already built in Analytics.tsx)
  const cemRows     = allSections.find(s => s.label === 'By CEM')?.rows      ?? []
  const clientRows  = allSections.find(s => s.label === 'By Client')?.rows   ?? []
  const buildingRows = allSections.find(s => s.label === 'By Building')?.rows ?? []
  const hasEntityCards = cemRows.length > 0 || clientRows.length > 0 || buildingRows.length > 0

  return (
    <Document>

      {/* ── Page 1: Summary + chart ──────────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <PageHeader dateLabel={dateLabel} generatedAt={generatedAt} activeFilters={activeFilters} />

        <Text style={S.sectionLabel}>SUMMARY</Text>
        <View style={S.kpiRow}>
          {kpis.map((k, i) => (
            <View key={k.label} style={[S.kpiCard, i === kpis.length - 1 ? S.kpiCardLast : {}]}>
              <Text style={S.kpiLabel}>{k.label}</Text>
              <Text style={[S.kpiValue, { color: k.color }]}>{k.value}</Text>
              {k.sub && <Text style={S.kpiSub}>{k.sub}</Text>}
            </View>
          ))}
        </View>

        {chartImageUrl && (
          <View style={S.chartSection}>
            <Text style={S.sectionLabel}>CHART OVERVIEW</Text>
            <Image src={chartImageUrl} style={S.chartImage} />
          </View>
        )}

        <PageFooter />
      </Page>

      {/* ── Page 2: Entity card overview (CEMs / Clients / Buildings) ─────── */}
      {hasEntityCards && (
        <Page size="A4" style={S.page}>
          <PageHeader dateLabel={dateLabel} generatedAt={generatedAt} activeFilters={activeFilters} />
          <Text style={S.sectionLabel}>ENTITY OVERVIEW</Text>
          <EntityCardSection title="CEMs"      rows={cemRows}      />
          <EntityCardSection title="Clients"   rows={clientRows}   />
          <EntityCardSection title="Buildings" rows={buildingRows} />
          <PageFooter />
        </Page>
      )}

      {/* ── One page per dimension breakdown table ───────────────────────── */}
      {allSections.map((section) => (
        <Page key={section.label} size="A4" style={S.page}>
          <PageHeader dateLabel={dateLabel} generatedAt={generatedAt} activeFilters={activeFilters} />
          <SectionTable section={section} />
          <PageFooter />
        </Page>
      ))}

    </Document>
  )
}
