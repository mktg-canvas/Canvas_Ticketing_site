const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open:         { bg: 'rgba(240,82,82,0.15)',   color: '#f05252', label: 'Open' },
  acknowledged: { bg: 'rgba(79,142,247,0.15)',  color: '#4f8ef7', label: 'Acknowledged' },
  in_progress:  { bg: 'rgba(245,166,35,0.15)',  color: '#f5a623', label: 'In Progress' },
  on_hold:      { bg: '#2e3545',                color: '#8b92a5', label: 'On Hold' },
  resolved:     { bg: 'rgba(46,204,138,0.15)',  color: '#2ecc8a', label: 'Resolved' },
  closed:       { bg: '#2e3545',                color: '#565e72', label: 'Closed' },
}

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  critical: { color: '#f05252', label: 'Critical' },
  high:     { color: '#f5a623', label: 'High' },
  medium:   { color: '#4f8ef7', label: 'Medium' },
  low:      { color: '#2ecc8a', label: 'Low' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export function PriorityDot({ priority }: { priority: string }) {
  const p = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: p.color }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
      {p.label}
    </span>
  )
}
