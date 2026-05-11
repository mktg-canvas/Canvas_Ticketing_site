import { prisma } from '../lib/prisma'

const locationInclude = {
  include: {
    building: { select: { id: true, name: true } },
    floor: { select: { id: true, name: true } },
  },
  orderBy: [{ building: { name: 'asc' as const } }, { floor: { name: 'asc' as const } }],
}

export async function listCompanies() {
  return prisma.company.findMany({
    where: { is_active: true },
    include: {
      locations: locationInclude,
      _count: { select: { tickets: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createCompany(name: string) {
  return prisma.company.create({
    data: { name },
    include: {
      locations: locationInclude,
      _count: { select: { tickets: true } },
    },
  })
}

export async function updateCompany(id: string, name: string) {
  return prisma.company.update({
    where: { id },
    data: { name },
    include: {
      locations: locationInclude,
      _count: { select: { tickets: true } },
    },
  })
}

export async function deactivateCompany(id: string) {
  return prisma.company.update({ where: { id }, data: { is_active: false } })
}

export async function addCompanyLocation(companyId: string, buildingId: string, floorId: string) {
  return prisma.companyLocation.create({
    data: { company_id: companyId, building_id: buildingId, floor_id: floorId },
    include: {
      building: { select: { id: true, name: true } },
      floor: { select: { id: true, name: true } },
    },
  })
}

export async function removeCompanyLocation(locationId: string) {
  return prisma.companyLocation.delete({ where: { id: locationId } })
}
