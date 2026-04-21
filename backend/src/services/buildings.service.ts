import { prisma } from '../lib/prisma'

export async function listBuildings() {
  return prisma.building.findMany({
    where: { is_active: true },
    include: { _count: { select: { floors: true, tickets: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createBuilding(name: string) {
  return prisma.building.create({ data: { name } })
}

export async function updateBuilding(id: string, name: string) {
  return prisma.building.update({ where: { id }, data: { name } })
}

export async function deactivateBuilding(id: string) {
  return prisma.building.update({ where: { id }, data: { is_active: false } })
}
