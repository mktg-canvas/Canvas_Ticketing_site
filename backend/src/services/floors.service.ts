import { prisma } from '../lib/prisma'

export async function listFloors(buildingId?: string) {
  return prisma.floor.findMany({
    where: {
      is_active: true,
      ...(buildingId && { building_id: buildingId }),
    },
    include: { building: { select: { id: true, name: true } }, _count: { select: { tickets: true } } },
    orderBy: { created_at: 'asc' },
  })
}

export async function createFloor(buildingId: string, name: string) {
  return prisma.floor.create({ data: { building_id: buildingId, name } })
}

export async function updateFloor(id: string, name: string) {
  return prisma.floor.update({ where: { id }, data: { name } })
}

export async function deactivateFloor(id: string) {
  return prisma.floor.update({ where: { id }, data: { is_active: false } })
}
