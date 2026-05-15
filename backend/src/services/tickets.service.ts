import { Prisma, TicketStatus, TicketSource } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { uploadFile, deleteFile } from '../lib/supabaseStorage'
import { JwtPayload } from '../types'

export async function createTicket(
  actor: JwtPayload,
  data: {
    buildingId: string
    floorId: string
    clientId: string
    categoryId: string
    subCategory?: string
    description?: string
    status?: string
    source?: string
    isPriority?: boolean
    files?: Express.Multer.File[]
  }
) {
  // ticket_number is assigned by the DB sequence — no application-level generation needed
  const createdTicket = await prisma.ticket.create({
    data: {
      building_id: data.buildingId,
      floor_id: data.floorId,
      client_id: data.clientId,
      category_id: data.categoryId,
      sub_category: data.subCategory ?? null,
      description: data.description ?? '',
      status: (data.status as TicketStatus) ?? 'open',
      source: (data.source as TicketSource) ?? 'client',
      is_priority: data.isPriority ?? false,
      // Map initial description to the stage matching the initial status
      open_note:        (!data.status || data.status === 'open')        ? (data.description ?? '') : undefined,
      in_progress_note: data.status === 'in_progress'                   ? (data.description ?? '') : undefined,
      closed_note:      data.status === 'closed'                        ? (data.description ?? '') : undefined,
      opened_at: (!data.status || data.status === 'open') ? new Date() : undefined,
      in_progress_at: data.status === 'in_progress' ? new Date() : undefined,
      closed_at: data.status === 'closed' ? new Date() : undefined,
      raised_by: actor.userId,
    },
  })

  await prisma.ticketActivity.create({
    data: {
      ticket_id: createdTicket.id,
      actor_id: actor.userId,
      activity_type: 'created',
      new_value: data.status ?? 'open',
    },
  })

  if (data.files?.length) {
    for (const file of data.files) {
      const url = await uploadFile(file.buffer, file.originalname, file.mimetype)
      await prisma.attachment.create({
        data: {
          ticket_id: createdTicket.id,
          uploaded_by: actor.userId,
          file_name: file.originalname,
          file_url: url,
          file_size: file.size,
          mime_type: file.mimetype,
          stage: 'open',
        },
      })
    }
  }

  return getTicketById(createdTicket.id)
}

export async function listTickets(
  actor: JwtPayload,
  filters: {
    status?: string
    category?: string
    buildingId?: string
    floorId?: string
    clientId?: string
    cemId?: string
    source?: string
    q?: string
    page?: number
    from?: string
    to?: string
    noPaginate?: boolean
  }
) {
  const page = filters.page || 1
  const take = 20
  const skip = (page - 1) * take

  const where: Prisma.TicketWhereInput = {}

  if (actor.role === 'cem') {
    where.raised_by = actor.userId
  }

  if (filters.status) where.status = filters.status as TicketStatus
  if (filters.category) where.category_id = filters.category
  if (filters.buildingId) where.building_id = filters.buildingId
  if (filters.floorId) where.floor_id = filters.floorId
  if (filters.clientId) where.client_id = filters.clientId
  if (filters.cemId && actor.role === 'super_admin') where.raised_by = filters.cemId
  if (filters.source) where.source = filters.source as TicketSource

  if (filters.from || filters.to) {
    where.created_at = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to   ? { lte: new Date(filters.to)   } : {}),
    }
  }

  if (filters.q) {
    const asNum = parseInt(filters.q.trim(), 10)
    where.ticket_number = isNaN(asNum) ? -1 : asNum
  }

  const findArgs: Prisma.TicketFindManyArgs = {
    where,
    include: {
      raiser: { select: { name: true } },
      building: { select: { name: true } },
      floor: { select: { name: true } },
      client: { select: { name: true } },
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: { created_at: 'desc' },
  }

  if (filters.q) {
    findArgs.take = 20
  } else if (filters.noPaginate) {
    findArgs.take = 2000
  } else {
    findArgs.take = take
    findArgs.skip = skip
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany(findArgs),
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
      client: { select: { name: true } },
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

  const updateData: {
    status: TicketStatus
    opened_at?: Date | null
    in_progress_at?: Date | null
    closed_at?: Date | null
  } = { status: newStatus as TicketStatus }

  if (newStatus === 'open') {
    if (!ticket.opened_at) updateData.opened_at = new Date()
    updateData.in_progress_at = null
    updateData.closed_at = null
  } else if (newStatus === 'in_progress') {
    if (!ticket.in_progress_at) updateData.in_progress_at = new Date()
    updateData.closed_at = null
  } else if (newStatus === 'closed') {
    if (!ticket.closed_at) updateData.closed_at = new Date()
  }

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

export async function editTicket(
  ticketId: string,
  data: {
    buildingId?: string
    floorId?: string
    clientId?: string
    categoryId?: string
    subCategory?: string | null
    description?: string
    source?: string
  }
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  const updateData: Record<string, unknown> = {}
  if (data.buildingId) updateData.building_id = data.buildingId
  if (data.floorId) updateData.floor_id = data.floorId
  if (data.clientId) updateData.client_id = data.clientId
  if (data.categoryId) updateData.category_id = data.categoryId
  if (data.subCategory !== undefined) updateData.sub_category = data.subCategory || null
  if (data.description !== undefined) updateData.description = data.description
  if (data.source) updateData.source = data.source

  await prisma.ticket.update({ where: { id: ticketId }, data: updateData })
  return getTicketById(ticketId)
}

export async function deleteTicket(_actor: JwtPayload, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }
  await prisma.ticket.delete({ where: { id: ticketId } })
}

export async function uploadAttachment(actor: JwtPayload, ticketId: string, file: Express.Multer.File, stage?: string | null) {
  const url = await uploadFile(file.buffer, file.originalname, file.mimetype)
  const attachment = await prisma.attachment.create({
    data: {
      ticket_id: ticketId,
      uploaded_by: actor.userId,
      file_name: file.originalname,
      file_url: url,
      file_size: file.size,
      mime_type: file.mimetype,
      stage: stage ?? null,
    },
  })
  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticketId,
      actor_id: actor.userId,
      activity_type: 'attachment_added',
      new_value: stage ? `${file.originalname} (${stage})` : file.originalname,
    },
  })
  return attachment
}

export async function deleteAttachment(actor: JwtPayload, ticketId: string, attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } })
  if (!attachment) throw { status: 404, message: 'Attachment not found' }
  if (attachment.ticket_id !== ticketId) throw { status: 404, message: 'Attachment not found' }

  if (attachment.file_url) await deleteFile(attachment.file_url)
  await prisma.attachment.delete({ where: { id: attachmentId } })
  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticketId,
      actor_id: actor.userId,
      activity_type: 'attachment_deleted',
      new_value: attachment.file_name,
    },
  })
}

export async function updateStageNote(
  ticketId: string,
  stage: 'open' | 'in_progress' | 'closed',
  note: string,
) {
  const field = stage === 'open' ? 'open_note'
    : stage === 'in_progress' ? 'in_progress_note'
    : 'closed_note'
  return prisma.ticket.update({
    where: { id: ticketId },
    data: { [field]: note },
  })
}
