import { prisma } from '../lib/prisma'

export async function listCompanies(buildingId?: string) {
  return prisma.company.findMany({
    where: {
      is_active: true,
      ...(buildingId && { building_id: buildingId }),
    },
    include: { building: { select: { id: true, name: true } }, _count: { select: { tickets: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createCompany(name: string, buildingId?: string) {
  return prisma.company.create({
    data: { name, building_id: buildingId ?? null },
  })
}

export async function updateCompany(id: string, name: string, buildingId?: string) {
  return prisma.company.update({
    where: { id },
    data: { name, ...(buildingId !== undefined && { building_id: buildingId || null }) },
  })
}

export async function deactivateCompany(id: string) {
  return prisma.company.update({ where: { id }, data: { is_active: false } })
}
