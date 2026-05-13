export type Period = '7d' | '30d' | 'all' | 'custom'

export function todayStr() { return new Date().toISOString().slice(0, 10) }

export function periodToParams(period: Period, customFrom: string, customTo: string) {
  if (period === 'all') return { noPaginate: true }
  if (period === 'custom') {
    return {
      noPaginate: true,
      ...(customFrom ? { from: customFrom + 'T00:00:00.000Z' } : {}),
      ...(customTo   ? { to:   customTo   + 'T23:59:59.999Z' } : {}),
    }
  }
  const days = period === '7d' ? 7 : 30
  const from = new Date()
  from.setDate(from.getDate() - days)
  from.setHours(0, 0, 0, 0)
  return { noPaginate: true, from: from.toISOString() }
}
