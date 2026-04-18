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
  const remaining = sla_due_at.getTime() - Date.now()
  if (remaining <= 0) return 'red'
  if (remaining < 2 * 60 * 60 * 1000) return 'amber'
  return 'green'
}
