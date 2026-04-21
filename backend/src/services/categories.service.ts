import { prisma } from '../lib/prisma'

export async function listCategories() {
  return prisma.category.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(name: string, slug: string) {
  return prisma.category.create({ data: { name, slug } })
}

export async function updateCategory(id: string, name: string) {
  return prisma.category.update({ where: { id }, data: { name } })
}

export async function deactivateCategory(id: string) {
  return prisma.category.update({ where: { id }, data: { is_active: false } })
}
