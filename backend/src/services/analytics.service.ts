import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface AnalyticsFilters {
  from?: Date
  to?: Date
  buildingId?: string
  companyId?: string
  categoryId?: string
  fmId?: string
}

interface DimRow {
  id: string
  name: string
  open: number
  in_progress: number
  closed: number
  total: number
}

interface MonthRow {
  month: string
  open: number
  in_progress: number
  closed: number
  total: number
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
  if (f.companyId) w.company_id = f.companyId
  if (f.categoryId) w.category_id = f.categoryId
  if (f.fmId) w.raised_by = f.fmId
  return w
}

async function groupByField(
  field: 'building_id' | 'category_id' | 'company_id' | 'raised_by' | 'floor_id',
  where: Prisma.TicketWhereInput
): Promise<Map<string, { open: number; in_progress: number; closed: number; total: number }>> {
  const rows = await prisma.ticket.groupBy({
    by: [field, 'status'] as any,
    where,
    _count: { id: true },
  })

  const map = new Map<string, { open: number; in_progress: number; closed: number; total: number }>()
  for (const r of rows) {
    const key = (r as any)[field] as string
    if (!map.has(key)) map.set(key, { open: 0, in_progress: 0, closed: 0, total: 0 })
    const entry = map.get(key)!
    const status = (r as any).status as string
    if (status === 'open') entry.open = r._count.id
    else if (status === 'in_progress') entry.in_progress = r._count.id
    else if (status === 'closed') entry.closed = r._count.id
    entry.total += r._count.id
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
  if (filters.companyId) sqlConditions.push(Prisma.sql`company_id = ${filters.companyId}::uuid`)
  if (filters.categoryId) sqlConditions.push(Prisma.sql`category_id = ${filters.categoryId}::uuid`)
  if (filters.fmId) sqlConditions.push(Prisma.sql`raised_by = ${filters.fmId}::uuid`)
  const whereClause = sqlConditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, ' AND ')}`
    : Prisma.empty

  const [
    statusCounts,
    closedWithTimes,
    buildings,
    categories,
    companies,
    fms,
    floors,
    byBuilding,
    byCategory,
    byCompany,
    byFm,
    byFloor,
    monthlyRaw,
  ] = await Promise.all([
    prisma.ticket.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.ticket.findMany({
      where: { ...where, closed_at: { not: null }, opened_at: { not: null } },
      select: { opened_at: true, closed_at: true },
    }),
    prisma.building.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.company.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: 'fm' }, select: { id: true, name: true } }),
    prisma.floor.findMany({ include: { building: { select: { name: true } } } }),
    groupByField('building_id', where),
    groupByField('category_id', where),
    groupByField('company_id', where),
    groupByField('raised_by', where),
    groupByField('floor_id', where),
    prisma.$queryRaw<Array<{ month: Date; status: string; count: number }>>`
      SELECT DATE_TRUNC('month', created_at) AS month, status, COUNT(*)::int AS count
      FROM tickets
      ${whereClause}
      GROUP BY month, status
      ORDER BY month ASC
    `,
  ])

  // Summary
  const summary = { total: 0, open: 0, in_progress: 0, closed: 0, avgResolutionHours: null as number | null }
  for (const r of statusCounts) {
    if (r.status === 'open') summary.open = r._count.id
    else if (r.status === 'in_progress') summary.in_progress = r._count.id
    else if (r.status === 'closed') summary.closed = r._count.id
    summary.total += r._count.id
  }
  if (closedWithTimes.length > 0) {
    const totalHours = closedWithTimes.reduce((sum, t) =>
      sum + (t.closed_at!.getTime() - t.opened_at!.getTime()) / 3_600_000, 0)
    summary.avgResolutionHours = Math.round((totalHours / closedWithTimes.length) * 10) / 10
  }

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
  const monthMap = new Map<string, MonthRow>()
  for (const r of monthlyRaw) {
    const key = new Date(r.month).toISOString().slice(0, 7) // "YYYY-MM"
    if (!monthMap.has(key)) monthMap.set(key, { month: key, open: 0, in_progress: 0, closed: 0, total: 0 })
    const entry = monthMap.get(key)!
    if (r.status === 'open') entry.open = r.count
    else if (r.status === 'in_progress') entry.in_progress = r.count
    else if (r.status === 'closed') entry.closed = r.count
    entry.total += r.count
  }
  const byMonth = Array.from(monthMap.values())

  return {
    summary,
    byBuilding: toDimRows(byBuilding, buildings),
    byCategory: toDimRows(byCategory, categories),
    byCompany: toDimRows(byCompany, companies),
    byFm: toDimRows(byFm, fms),
    byFloor: byFloorRows,
    byMonth,
  }
}
