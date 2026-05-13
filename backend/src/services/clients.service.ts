import { prisma } from '../lib/prisma'

const locationInclude = {
  include: {
    building: { select: { id: true, name: true } },
    floor: { select: { id: true, name: true } },
  },
  orderBy: [{ building: { name: 'asc' as const } }, { floor: { name: 'asc' as const } }],
}

export async function listClients() {
  return prisma.client.findMany({
    where: { is_active: true },
    include: {
      locations: locationInclude,
      _count: { select: { tickets: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createClient(name: string) {
  return prisma.client.create({
    data: { name },
    include: {
      locations: locationInclude,
      _count: { select: { tickets: true } },
    },
  })
}

export async function updateClient(id: string, name: string) {
  return prisma.client.update({
    where: { id },
    data: { name },
    include: {
      locations: locationInclude,
      _count: { select: { tickets: true } },
    },
  })
}

export async function deactivateClient(id: string) {
  return prisma.client.update({ where: { id }, data: { is_active: false } })
}

export async function addClientLocation(clientId: string, buildingId: string, floorId: string) {
  return prisma.clientLocation.create({
    data: { client_id: clientId, building_id: buildingId, floor_id: floorId },
    include: {
      building: { select: { id: true, name: true } },
      floor: { select: { id: true, name: true } },
    },
  })
}

export async function removeClientLocation(locationId: string) {
  return prisma.clientLocation.delete({ where: { id: locationId } })
}
