import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

export async function listUsers() {
  return prisma.user.findMany({
    where: { is_active: true },
    select: { id: true, name: true, email: true, role: true, last_login: true, created_at: true },
    orderBy: { created_at: 'desc' },
  })
}

export async function createUser(data: { name: string; email: string; password: string; role: 'fm' | 'super_admin' }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  const hash = await bcrypt.hash(data.password, 12)

  if (existing) {
    if (existing.is_active) throw { status: 409, message: 'Email already registered' }
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: data.name, password_hash: hash, role: data.role, is_active: true },
      select: { id: true, name: true, email: true, role: true, created_at: true },
    })
  }

  return prisma.user.create({
    data: { name: data.name, email: data.email, password_hash: hash, role: data.role },
    select: { id: true, name: true, email: true, role: true, created_at: true },
  })
}

export async function updateUser(id: string, data: { name?: string }) {
  return prisma.user.update({
    where: { id },
    data: { ...(data.name && { name: data.name }) },
    select: { id: true, name: true, email: true, role: true },
  })
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { is_active: false },
    select: { id: true, name: true, is_active: true },
  })
}
