import { prisma } from './prisma'

export async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.ticket.count()
  const seq = String(count + 1).padStart(4, '0')
  return `CW-${year}-${seq}`
}
