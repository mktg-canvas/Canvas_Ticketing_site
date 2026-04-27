import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const OPEN   = '#ef4444'
const PROG   = '#f59e0b'
const CLOSED = '#10b981'
const ACCENT = '#6366f1'
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
  tableRows: ReportRow[]
  dimLabel: string
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
    paddingHorizontal: 40,
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
  chartSection: { marginBottom: 22 },
  chartImage: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableSection: { marginBottom: 22 },
  tHead: {
    flexDirection: 'row',
    backgroundColor: BG2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    borderStyle: 'solid',
  },
  tRowAlt: { backgroundColor: BG1 },
  tTotals: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: BG2,
    borderWidth: 1,
    borderTopWidth: 2,
    borderTopColor: BORDER2,
    borderColor: BORDER,
    borderStyle: 'solid',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  cName:  { flex: 3 },
  cStat:  { flex: 1, textAlign: 'right' },
  cPct:   { flex: 1.2, textAlign: 'right' },
  th:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREY3, letterSpacing: 0.5 },
  td:     { fontSize: 9, color: GREY2 },
  tdBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREY1 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopStyle: 'solid',
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: GREY4 },
})

export function AnalyticsReportPDF({
  summary, tableRows, dimLabel, dateLabel,
  chartImageUrl, generatedAt, activeFilters,
}: Props) {
  const totals = tableRows.reduce(
    (acc, r) => ({
      open: acc.open + r.open,
      in_progress: acc.in_progress + r.in_progress,
      closed: acc.closed + r.closed,
      total: acc.total + r.total,
    }),
    { open: 0, in_progress: 0, closed: 0, total: 0 }
  )
  const totalPct = totals.total > 0 ? Math.round((totals.closed / totals.total) * 100) : 0

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

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Header */}
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

        {/* KPI Summary */}
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

        {/* Chart */}
        {chartImageUrl && (
          <View style={S.chartSection}>
            <Text style={S.sectionLabel}>TICKETS BY {dimLabel.toUpperCase()} — CHART</Text>
            <Image src={chartImageUrl} style={S.chartImage} />
          </View>
        )}

        {/* Breakdown table */}
        <View style={S.tableSection}>
          <Text style={S.sectionLabel}>BREAKDOWN BY {dimLabel.toUpperCase()}</Text>

          {/* Head */}
          <View style={S.tHead}>
            <Text style={[S.th, S.cName]}>{dimLabel}</Text>
            <Text style={[S.th, S.cStat]}>Open</Text>
            <Text style={[S.th, S.cStat]}>In Prog</Text>
            <Text style={[S.th, S.cStat]}>Closed</Text>
            <Text style={[S.th, S.cStat]}>Total</Text>
            <Text style={[S.th, S.cPct]}>% Closed</Text>
          </View>

          {/* Body */}
          {tableRows.map((row, i) => (
            <View key={i} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
              <Text style={[S.tdBold, S.cName]}>{row.name}</Text>
              <Text style={[S.td, S.cStat, { color: OPEN   }]}>{row.open}</Text>
              <Text style={[S.td, S.cStat, { color: PROG   }]}>{row.in_progress}</Text>
              <Text style={[S.td, S.cStat, { color: CLOSED }]}>{row.closed}</Text>
              <Text style={[S.tdBold, S.cStat]}>{row.total}</Text>
              <Text style={[S.tdBold, S.cPct, { color: CLOSED }]}>{row.pctClosed}%</Text>
            </View>
          ))}

          {/* Totals */}
          {tableRows.length > 1 && (
            <View style={S.tTotals}>
              <Text style={[S.tdBold, S.cName]}>Total</Text>
              <Text style={[S.tdBold, S.cStat, { color: OPEN   }]}>{totals.open}</Text>
              <Text style={[S.tdBold, S.cStat, { color: PROG   }]}>{totals.in_progress}</Text>
              <Text style={[S.tdBold, S.cStat, { color: CLOSED }]}>{totals.closed}</Text>
              <Text style={[S.tdBold, S.cStat]}>{totals.total}</Text>
              <Text style={[S.tdBold, S.cPct,  { color: CLOSED }]}>{totalPct}%</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Canvas Facility Management  ·  Confidential</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
