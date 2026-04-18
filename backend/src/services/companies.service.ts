import { prisma } from '../lib/prisma'

export async function listCompanies(adminId?: string) {
  return prisma.company.findMany({
    where: {
      is_active: true,
      ...(adminId && { assigned_admin_id: adminId }),
    },
    include: {
      assigned_admin: { select: { id: true, name: true, email: true } },
      _count: { select: { tickets: true, users: true } },
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function createCompany(data: {
  name: string
  officeLocation?: string
  assignedAdminId?: string
}) {
  return prisma.company.create({
    data: {
      name: data.name,
      office_location: data.officeLocation ?? null,
      assigned_admin_id: data.assignedAdminId ?? null,
    },
  })
}

export async function updateCompany(id: string, data: {
  name?: string
  officeLocation?: string
  assignedAdminId?: string
}) {
  return prisma.company.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.officeLocation !== undefined && { office_location: data.officeLocation }),
      ...(data.assignedAdminId !== undefined && { assigned_admin_id: data.assignedAdminId }),
    },
  })
}

export async function deactivateCompany(id: string) {
  return prisma.company.update({
    where: { id },
    data: { is_active: false },
  })
}
