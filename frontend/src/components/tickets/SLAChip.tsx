import { Clock } from 'lucide-react'

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Overdue'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function SLAChip({ sla_due_at }: { sla_due_at?: string | null }) {
  if (!sla_due_at) return null

  const due = new Date(sla_due_at).getTime()
  const now = Date.now()
  const remaining = due - now
  const overdue = remaining <= 0

  let color = '#2ecc8a'
  if (overdue) color = '#f05252'
  else if (remaining < 2 * 3600 * 1000) color = '#f5a623'

  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: `${color}20`, color }}>
      <Clock size={11} />
      {formatDuration(remaining)}
    </span>
  )
}
