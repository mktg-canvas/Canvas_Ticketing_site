import { prisma } from './prisma'

export async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CW-${year}-`

  const last = await prisma.ticket.findFirst({
    where: { ticket_number: { startsWith: prefix } },
    orderBy: { ticket_number: 'desc' },
    select: { ticket_number: true },
  })

  const lastSeq = last ? parseInt(last.ticket_number.slice(prefix.length), 10) : 0
  const next = `${prefix}${String(lastSeq + 1).padStart(4, '0')}`
  console.log(`[ticketNumber] last=${last?.ticket_number ?? 'none'} → next=${next}`)
  return next
}
