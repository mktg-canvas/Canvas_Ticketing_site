import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { Role } from '../types'

export async function listUsers(requestorRole: Role, requestorCompanyId?: string) {
  if (requestorRole === 'super_admin') {
    return prisma.user.findMany({
      where: { is_active: true },
      select: { id: true, name: true, email: true, role: true, company_id: true, last_login: true, created_at: true },
      orderBy: { created_at: 'desc' },
    })
  }
  // admin sees only clients in their assigned companies
  return prisma.user.findMany({
    where: {
      role: 'client',
      is_active: true,
      company: { assigned_admin_id: requestorCompanyId },
    },
    select: { id: true, name: true, email: true, role: true, company_id: true, last_login: true, created_at: true },
    orderBy: { created_at: 'desc' },
  })
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: Role
  companyId?: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw { status: 409, message: 'Email already registered' }

  const hash = await bcrypt.hash(data.password, 12)
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash: hash,
      role: data.role,
      company_id: data.companyId ?? null,
    },
    select: { id: true, name: true, email: true, role: true, company_id: true, created_at: true },
  })
}

export async function updateUser(id: string, data: { name?: string; email?: string; companyId?: string }) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.companyId !== undefined && { company_id: data.companyId }),
    },
    select: { id: true, name: true, email: true, role: true, company_id: true },
  })
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { is_active: false },
    select: { id: true, name: true, is_active: true },
  })
}
