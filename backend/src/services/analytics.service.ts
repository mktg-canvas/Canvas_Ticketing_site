import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { rlsStore } from '../lib/rlsContext'

export interface AnalyticsFilters {
  from?: Date
  to?: Date
  buildingId?: string
  clientId?: string
  categoryId?: string
  cemId?: string
  source?: 'client' | 'cem'
}

interface DimRow {
  id: string
  name: string
  open: number
  in_progress: number
  closed: number
  total: number
  client_total: number
  cem_total: number
  open_client: number
  in_progress_client: number
  closed_client: number
  open_cem: number
  in_progress_cem: number
  closed_cem: number
}

interface MonthRow {
  month: string
  open: number
  in_progress: number
  closed: number
  total: number
  client_total: number
  cem_total: number
  open_client: number
  in_progress_client: number
  closed_client: number
  open_cem: number
  in_progress_cem: number
  closed_cem: number
}

function buildWhere(f: AnalyticsFilters): Prisma.TicketWhereInput {
  const w: Prisma.TicketWhereInput = {}
  if (f.from || f.to) {
    w.created_at = {
      ...(f.from && { gte: f.from }),
      ...(f.to && { lte: f.to }),
    }
  }
  if (f.buildingId) w.building_id = f.buildingId
  if (f.clientId) w.client_id = f.clientId
  if (f.categoryId) w.category_id = f.categoryId
  if (f.cemId) w.raised_by = f.cemId
  if (f.source) w.source = f.source
  return w
}

async function groupByField(
  field: 'building_id' | 'category_id' | 'client_id' | 'raised_by' | 'floor_id',
  where: Prisma.TicketWhereInput
): Promise<Map<string, Omit<DimRow, 'id' | 'name'>>> {
  const rows = await prisma.ticket.groupBy({
    by: [field, 'status', 'source'] as any,
    where,
    _count: { id: true },
  })

  const zero = () => ({ open: 0, in_progress: 0, closed: 0, total: 0, client_total: 0, cem_total: 0, open_client: 0, in_progress_client: 0, closed_client: 0, open_cem: 0, in_progress_cem: 0, closed_cem: 0 })
  const map = new Map<string, ReturnType<typeof zero>>()
  for (const r of rows) {
    const key = (r as any)[field] as string
    if (!map.has(key)) map.set(key, zero())
    const entry = map.get(key)!
    const status = (r as any).status as string
    const source = (r as any).source as string
    const n = r._count.id
    if (status === 'open') entry.open += n
    else if (status === 'in_progress') entry.in_progress += n
    else if (status === 'closed') entry.closed += n
    entry.total += n
    if (source === 'client') {
      entry.client_total += n
      if (status === 'open') entry.open_client += n
      else if (status === 'in_progress') entry.in_progress_client += n
      else if (status === 'closed') entry.closed_client += n
    } else if (source === 'cem') {
      entry.cem_total += n
      if (status === 'open') entry.open_cem += n
      else if (status === 'in_progress') entry.in_progress_cem += n
      else if (status === 'closed') entry.closed_cem += n
    }
  }
  return map
}

export async function getAnalytics(filters: AnalyticsFilters) {
  const where = buildWhere(filters)

  // Build raw SQL conditions for the monthly query
  const sqlConditions: Prisma.Sql[] = []
  if (filters.from) sqlConditions.push(Prisma.sql`created_at >= ${filters.from}`)
  if (filters.to) sqlConditions.push(Prisma.sql`created_at <= ${filters.to}`)
  if (filters.buildingId) sqlConditions.push(Prisma.sql`building_id = ${filters.buildingId}::uuid`)
  if (filters.clientId) sqlConditions.push(Prisma.sql`client_id = ${filters.clientId}::uuid`)
  if (filters.categoryId) sqlConditions.push(Prisma.sql`category_id = ${filters.categoryId}::uuid`)
  if (filters.cemId) sqlConditions.push(Prisma.sql`raised_by = ${filters.cemId}::uuid`)
  if (filters.source) sqlConditions.push(Prisma.sql`source = ${filters.source}::"TicketSource"`)
  const whereClause = sqlConditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, ' AND ')}`
    : Prisma.empty

  const [
    statusCounts,
    buildings,
    categories,
    clients,
    cems,
    floors,
    byBuilding,
    byCategory,
    byClient,
    byCem,
    byFloor,
    bySourceRaw,
  ] = await Promise.all([
    prisma.ticket.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.building.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.client.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.floor.findMany({ include: { building: { select: { name: true } } } }),
    groupByField('building_id', where),
    groupByField('category_id', where),
    groupByField('client_id', where),
    groupByField('raised_by', where),
    groupByField('floor_id', where),
    prisma.ticket.groupBy({ by: ['source', 'status'] as any, where, _count: { id: true } }),
  ])

  // $queryRaw is not intercepted by the Prisma model extension, so RLS context is not
  // set automatically. Wrap both raw queries in one $transaction with an explicit set_config
  // call so the DB-level RLS policy can evaluate correctly.
  const ctx = rlsStore.getStore()

  const monthlyQuery = prisma.$queryRaw<Array<{ month: Date; status: string; source: string; count: number }>>`
    SELECT DATE_TRUNC('month', created_at) AS month, status, source, COUNT(*)::int AS count
    FROM tickets
    ${whereClause}
    GROUP BY month, status, source
    ORDER BY month ASC
  `

  const avgConditions = [
    Prisma.sql`closed_at IS NOT NULL`,
    Prisma.sql`opened_at IS NOT NULL`,
    ...sqlConditions,
  ]
  const avgQuery = prisma.$queryRaw<[{ avg_hours: string | null }]>`
    SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600)::numeric, 1) AS avg_hours
    FROM tickets
    WHERE ${Prisma.join(avgConditions, ' AND ')}
  `

  let monthlyRaw: Array<{ month: Date; status: string; source: string; count: number }>
  let avgHours: number | null = null

  if (ctx) {
    const results = await prisma.$transaction([
      prisma.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId}, TRUE), set_config('app.current_user_role', ${ctx.role}, TRUE)`,
      monthlyQuery,
      avgQuery,
    ])
    monthlyRaw = results[1] as Array<{ month: Date; status: string; source: string; count: number }>
    const avgRow = (results[2] as [{ avg_hours: string | null }])[0]
    avgHours = avgRow?.avg_hours != null ? Number(avgRow.avg_hours) : null
  } else {
    const [monthly, avgResult] = await Promise.all([monthlyQuery, avgQuery])
    monthlyRaw = monthly
    avgHours = avgResult[0]?.avg_hours != null ? Number(avgResult[0].avg_hours) : null
  }

  // Summary
  const summary = { total: 0, open: 0, in_progress: 0, closed: 0, avgResolutionHours: null as number | null }
  for (const r of statusCounts) {
    if (r.status === 'open') summary.open = r._count.id
    else if (r.status === 'in_progress') summary.in_progress = r._count.id
    else if (r.status === 'closed') summary.closed = r._count.id
    summary.total += r._count.id
  }
  summary.avgResolutionHours = avgHours

  // Dimension rows
  function toDimRows(map: Map<string, any>, lookup: { id: string; name: string }[], extraName?: (id: string) => string): DimRow[] {
    return lookup
      .filter(item => map.has(item.id))
      .map(item => ({
        id: item.id,
        name: extraName ? extraName(item.id) : item.name,
        ...map.get(item.id)!,
      }))
      .sort((a, b) => b.total - a.total)
  }

  const floorNameMap = new Map(floors.map(f => [f.id, `${f.building.name} · ${f.name}`]))
  const byFloorRows: DimRow[] = Array.from(byFloor.entries())
    .map(([id, counts]) => ({ id, name: floorNameMap.get(id) ?? id, ...counts }))
    .sort((a, b) => b.total - a.total)

  // Monthly trends
  const zeroMonth = (): MonthRow => ({ month: '', open: 0, in_progress: 0, closed: 0, total: 0, client_total: 0, cem_total: 0, open_client: 0, in_progress_client: 0, closed_client: 0, open_cem: 0, in_progress_cem: 0, closed_cem: 0 })
  const monthMap = new Map<string, MonthRow>()
  for (const r of monthlyRaw) {
    const key = new Date(r.month).toISOString().slice(0, 7) // "YYYY-MM"
    if (!monthMap.has(key)) { const z = zeroMonth(); z.month = key; monthMap.set(key, z) }
    const entry = monthMap.get(key)!
    const n = r.count
    if (r.status === 'open') entry.open += n
    else if (r.status === 'in_progress') entry.in_progress += n
    else if (r.status === 'closed') entry.closed += n
    entry.total += n
    if (r.source === 'client') {
      entry.client_total += n
      if (r.status === 'open') entry.open_client += n
      else if (r.status === 'in_progress') entry.in_progress_client += n
      else if (r.status === 'closed') entry.closed_client += n
    } else if (r.source === 'cem') {
      entry.cem_total += n
      if (r.status === 'open') entry.open_cem += n
      else if (r.status === 'in_progress') entry.in_progress_cem += n
      else if (r.status === 'closed') entry.closed_cem += n
    }
  }
  const byMonth = Array.from(monthMap.values())

  // Source breakdown
  const sourceMap = new Map<string, { open: number; in_progress: number; closed: number; total: number }>()
  for (const r of bySourceRaw) {
    const key = (r as any).source as string
    if (!sourceMap.has(key)) sourceMap.set(key, { open: 0, in_progress: 0, closed: 0, total: 0 })
    const entry = sourceMap.get(key)!
    const status = (r as any).status as string
    if (status === 'open') entry.open = r._count.id
    else if (status === 'in_progress') entry.in_progress = r._count.id
    else if (status === 'closed') entry.closed = r._count.id
    entry.total += r._count.id
  }
  const SOURCE_LABELS: Record<string, string> = { client: 'Client Reported', cem: 'CEM Observed' }
  const bySource: DimRow[] = Array.from(sourceMap.entries()).map(([id, counts]) => ({
    id,
    name: SOURCE_LABELS[id] ?? id,
    ...counts,
    client_total: id === 'client' ? counts.total : 0,
    cem_total:    id === 'cem'    ? counts.total : 0,
    open_client:          id === 'client' ? counts.open : 0,
    in_progress_client:   id === 'client' ? counts.in_progress : 0,
    closed_client:        id === 'client' ? counts.closed : 0,
    open_cem:             id === 'cem'    ? counts.open : 0,
    in_progress_cem:      id === 'cem'    ? counts.in_progress : 0,
    closed_cem:           id === 'cem'    ? counts.closed : 0,
  }))

  return {
    summary,
    byBuilding: toDimRows(byBuilding, buildings),
    byCategory: toDimRows(byCategory, categories),
    byClient: toDimRows(byClient, clients),
    byCem: toDimRows(byCem, cems),
    byFloor: byFloorRows,
    byMonth,
    bySource,
  }
}
