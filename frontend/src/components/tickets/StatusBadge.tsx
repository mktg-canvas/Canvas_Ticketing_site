const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open:        { bg: 'var(--bg-danger-15)',  color: 'var(--color-danger)',  label: 'Open' },
  in_progress: { bg: 'var(--bg-warning-15)', color: 'var(--color-warning)', label: 'In Progress' },
  closed:      { bg: 'var(--color-bg4)',     color: 'var(--color-txt3)',    label: 'Closed' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}
