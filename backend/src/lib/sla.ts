const SLA_HOURS: Record<string, { ack: number; resolve: number }> = {
  critical: { ack: 1, resolve: 4 },
  high:     { ack: 2, resolve: 8 },
  medium:   { ack: 4, resolve: 24 },
  low:      { ack: 8, resolve: 72 },
}

export function getSlaDeadline(priority: string): Date {
  const hours = SLA_HOURS[priority]?.resolve ?? 24
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export function getSlaStatus(sla_due_at: Date | null): 'green' | 'amber' | 'red' {
  if (!sla_due_at) return 'green'
  const now = Date.now()
  const due = sla_due_at.getTime()
  const total = due - now
  const original = due - (due - now)
  if (total <= 0) return 'red'
  // amber if less than 50% of time remaining
  const elapsed = now - (due - (SLA_HOURS['medium'].resolve * 60 * 60 * 1000))
  if (total < (due - now) / 2) return 'amber'
  return 'green'
}
