const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open:         { bg: 'var(--bg-danger-15)',   color: 'var(--color-danger)', label: 'Open' },
  acknowledged: { bg: 'var(--bg-accent-15)',  color: 'var(--color-accent)', label: 'Acknowledged' },
  in_progress:  { bg: 'var(--bg-warning-15)',  color: 'var(--color-warning)', label: 'In Progress' },
  on_hold:      { bg: 'var(--color-bg4)',                color: 'var(--color-txt2)', label: 'On Hold' },
  resolved:     { bg: 'var(--bg-success-15)',  color: 'var(--color-success)', label: 'Resolved' },
  closed:       { bg: 'var(--color-bg4)',                color: 'var(--color-txt3)', label: 'Closed' },
}

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  critical: { color: 'var(--color-danger)', label: 'Critical' },
  high:     { color: 'var(--color-warning)', label: 'High' },
  medium:   { color: 'var(--color-accent)', label: 'Medium' },
  low:      { color: 'var(--color-success)', label: 'Low' },
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
