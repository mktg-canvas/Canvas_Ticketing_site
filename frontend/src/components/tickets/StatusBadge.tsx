const STATUS_MAP: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  open:        { bg: 'var(--bg-danger-10)',  color: 'var(--color-danger)',  dot: 'var(--color-danger)',  label: 'Open' },
  in_progress: { bg: 'var(--bg-warning-15)', color: 'var(--color-warning)', dot: 'var(--color-warning)', label: 'In Progress' },
  closed:      { bg: 'var(--color-bg3)',     color: 'var(--color-txt3)',    dot: 'var(--color-txt3)',    label: 'Closed' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.open
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}
