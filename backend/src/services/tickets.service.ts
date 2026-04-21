import { Prisma, TicketStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { generateTicketNumber } from '../lib/ticketNumber'
import { uploadFile } from '../lib/supabaseStorage'
import { JwtPayload } from '../types'

export async function createTicket(
  actor: JwtPayload,
  data: {
    buildingId: string
    floorId: string
    companyId: string
    categoryId: string
    subCategory?: string
    description: string
    files?: Express.Multer.File[]
  }
) {
  const ticketNumber = await generateTicketNumber()

  const ticket = await prisma.ticket.create({
    data: {
      ticket_number: ticketNumber,
      building_id: data.buildingId,
      floor_id: data.floorId,
      company_id: data.companyId,
      category_id: data.categoryId,
      sub_category: data.subCategory ?? null,
      description: data.description,
      status: 'open',
      raised_by: actor.userId,
    },
  })

  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticket.id,
      actor_id: actor.userId,
      activity_type: 'created',
      new_value: 'open',
    },
  })

  if (data.files?.length) {
    for (const file of data.files) {
      const url = await uploadFile(file.buffer, file.originalname, file.mimetype)
      await prisma.attachment.create({
        data: {
          ticket_id: ticket.id,
          uploaded_by: actor.userId,
          file_name: file.originalname,
          file_url: url,
          file_size: file.size,
          mime_type: file.mimetype,
        },
      })
    }
  }

  return getTicketById(ticket.id)
}

export async function listTickets(
  actor: JwtPayload,
  filters: {
    status?: string
    category?: string
    buildingId?: string
    floorId?: string
    companyId?: string
    page?: number
  }
) {
  const page = filters.page || 1
  const take = 20
  const skip = (page - 1) * take

  const where: Prisma.TicketWhereInput = {}

  if (actor.role === 'fm') {
    where.raised_by = actor.userId
  }

  if (filters.status) where.status = filters.status as TicketStatus
  if (filters.category) where.category_id = filters.category
  if (filters.buildingId) where.building_id = filters.buildingId
  if (filters.floorId) where.floor_id = filters.floorId
  if (filters.companyId) where.company_id = filters.companyId

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        raiser: { select: { name: true } },
        building: { select: { name: true } },
        floor: { select: { name: true } },
        company: { select: { name: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { attachments: true } },
      },
      orderBy: { created_at: 'desc' },
      take,
      skip,
    }),
    prisma.ticket.count({ where }),
  ])

  return { tickets, total, page, pages: Math.ceil(total / take) }
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      raiser: { select: { name: true, email: true } },
      building: { select: { name: true } },
      floor: { select: { name: true } },
      company: { select: { name: true } },
      category: { select: { id: true, name: true, slug: true } },
      attachments: true,
      activities: {
        include: { actor: { select: { name: true, role: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }
  return ticket
}

export async function updateTicketStatus(actor: JwtPayload, ticketId: string, newStatus: string, comment?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  const updateData: { status: TicketStatus; closed_at?: Date } = { status: newStatus as TicketStatus }
  if (newStatus === 'closed') updateData.closed_at = new Date()

  const [updated] = await Promise.all([
    prisma.ticket.update({ where: { id: ticketId }, data: updateData }),
    prisma.ticketActivity.create({
      data: {
        ticket_id: ticketId,
        actor_id: actor.userId,
        activity_type: newStatus === 'closed' ? 'closed' : 'status_changed',
        old_value: ticket.status,
        new_value: newStatus,
        comment: comment ?? null,
      },
    }),
  ])

  return updated
}

export async function addComment(actor: JwtPayload, ticketId: string, comment: string, isInternal: boolean) {
  await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } })
  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticketId,
      actor_id: actor.userId,
      activity_type: isInternal ? 'note_added' : 'comment_added',
      comment,
      is_internal: isInternal,
    },
  })
  return getTicketById(ticketId)
}

export async function deleteTicket(_actor: JwtPayload, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }
  await prisma.ticket.delete({ where: { id: ticketId } })
}

export async function uploadAttachment(actor: JwtPayload, ticketId: string, file: Express.Multer.File) {
  const url = await uploadFile(file.buffer, file.originalname, file.mimetype)
  const attachment = await prisma.attachment.create({
    data: {
      ticket_id: ticketId,
      uploaded_by: actor.userId,
      file_name: file.originalname,
      file_url: url,
      file_size: file.size,
      mime_type: file.mimetype,
    },
  })
  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticketId,
      actor_id: actor.userId,
      activity_type: 'attachment_added',
      new_value: file.originalname,
    },
  })
  return attachment
}
