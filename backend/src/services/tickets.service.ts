import { Prisma, TicketCategory, TicketPriority, TicketStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { getSlaDeadline } from '../lib/sla'
import { generateTicketNumber } from '../lib/ticketNumber'
import { uploadFile } from '../lib/supabaseStorage'
import { JwtPayload } from '../types'
import * as email from '../email/emailService'

export async function createTicket(
  actor: JwtPayload,
  data: {
    title: string
    description: string
    category: string
    priority: string
    files?: Express.Multer.File[]
  }
) {
  const user = await prisma.user.findUnique({ where: { id: actor.userId } })
  if (!user?.company_id) throw { status: 400, message: 'You must be assigned to a company to raise a ticket.' }

  const ticketNumber = await generateTicketNumber()
  const sla_due_at = getSlaDeadline(data.priority)

  const ticket = await prisma.ticket.create({
    data: {
      ticket_number: ticketNumber,
      title: data.title,
      description: data.description,
      category: data.category as TicketCategory,
      priority: data.priority as TicketPriority,
      status: 'open',
      raised_by: actor.userId,
      company_id: user.company_id,
      sla_due_at,
    },
  })

  // Log creation activity
  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticket.id,
      actor_id: actor.userId,
      actor_role: actor.role,
      activity_type: 'created',
      new_value: 'open',
    },
  })

  // Upload attachments
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

  const fullTicket = await getTicketById(ticket.id)

  // Fire emails async — don't block response
  const raiser = await prisma.user.findUnique({ where: { id: actor.userId } })
  if (raiser) {
    email.sendTicketCreatedClient(raiser.email, raiser.name, {
      ticket_number: fullTicket.ticket_number,
      title: fullTicket.title,
      category: fullTicket.category,
      priority: fullTicket.priority,
      created_at: fullTicket.created_at.toISOString(),
      sla_due_at: fullTicket.sla_due_at?.toISOString() ?? null,
    }).catch(() => {})
  }

  const company = await prisma.company.findUnique({ where: { id: ticket.company_id } })
  if (company?.assigned_admin_id) {
    const adminUser = await prisma.user.findUnique({ where: { id: company.assigned_admin_id } })
    if (adminUser) {
      email.sendTicketCreatedAdmin(adminUser.email, {
        ticket_number: fullTicket.ticket_number,
        title: fullTicket.title,
        priority: fullTicket.priority,
        company: company.name,
        created_at: fullTicket.created_at.toISOString(),
      }).catch(() => {})
    }
  }

  return fullTicket
}

export async function listTickets(
  actor: JwtPayload,
  filters: {
    status?: string
    priority?: string
    category?: string
    companyId?: string
    assignedTo?: string
    page?: number
  }
) {
  const page = filters.page || 1
  const take = 20
  const skip = (page - 1) * take

  const where: Prisma.TicketWhereInput = {}

  // Role-based scoping
  if (actor.role === 'client') {
    where.raised_by = actor.userId
  } else if (actor.role === 'admin') {
    const adminCompanies = await prisma.company.findMany({
      where: { assigned_admin_id: actor.userId },
      select: { id: true },
    })
    where.company_id = { in: adminCompanies.map((c) => c.id) }
  }
  // super_admin sees all — no scope filter

  if (filters.status) where.status = filters.status as TicketStatus
  if (filters.priority) where.priority = filters.priority as TicketPriority
  if (filters.category) where.category = filters.category as TicketCategory
  if (filters.companyId) where.company_id = filters.companyId
  if (filters.assignedTo) where.assigned_to = filters.assignedTo

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        raiser: { select: { name: true, email: true } },
        company: { select: { name: true, office_location: true } },
        assignee: { select: { name: true } },
        _count: { select: { attachments: true, activities: true } },
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
      company: { select: { name: true, office_location: true } },
      assignee: { select: { name: true, email: true } },
      attachments: true,
      rating: true,
      activities: {
        include: { actor: { select: { name: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
  })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }
  return ticket
}

export async function updateTicketStatus(
  actor: JwtPayload,
  ticketId: string,
  newStatus: string,
  comment?: string
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  const updateData: { status: TicketStatus; resolved_at?: Date; closed_at?: Date } = { status: newStatus as TicketStatus }
  if (newStatus === 'resolved') updateData.resolved_at = new Date()
  if (newStatus === 'closed') updateData.closed_at = new Date()

  const [updated] = await Promise.all([
    prisma.ticket.update({ where: { id: ticketId }, data: updateData }),
    prisma.ticketActivity.create({
      data: {
        ticket_id: ticketId,
        actor_id: actor.userId,
        actor_role: actor.role,
        activity_type: 'status_changed',
        old_value: ticket.status,
        new_value: newStatus,
        comment: comment || null,
      },
    }),
  ])

  // Notify client of status change
  const raiser = await prisma.user.findUnique({ where: { id: ticket.raised_by } })
  if (raiser && newStatus !== 'closed') {
    if (newStatus === 'resolved') {
      const token = Buffer.from(`${ticketId}:${Date.now()}`).toString('base64')
      email.sendTicketResolvedClient(raiser.email, raiser.name, {
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        resolved_at: new Date().toISOString(),
      }, token).catch(() => {})
    } else {
      email.sendStatusUpdatedClient(raiser.email, raiser.name, {
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: newStatus,
      }).catch(() => {})
    }
  }

  return updated
}

export async function assignTicket(actor: JwtPayload, ticketId: string, adminId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }

  const [updated] = await Promise.all([
    prisma.ticket.update({ where: { id: ticketId }, data: { assigned_to: adminId } }),
    prisma.ticketActivity.create({
      data: {
        ticket_id: ticketId,
        actor_id: actor.userId,
        actor_role: actor.role,
        activity_type: 'assigned',
        new_value: adminId,
      },
    }),
  ])
  return updated
}

export async function addComment(
  actor: JwtPayload,
  ticketId: string,
  comment: string,
  isInternal: boolean
) {
  if (isInternal && actor.role === 'client') {
    throw { status: 403, message: 'Clients cannot add internal notes' }
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  await prisma.ticketActivity.create({
    data: {
      ticket_id: ticketId,
      actor_id: actor.userId,
      actor_role: actor.role,
      activity_type: isInternal ? 'note_added' : 'comment_added',
      comment,
      is_internal: isInternal,
    },
  })

  // Notify the other party
  if (!isInternal && ticket) {
    if (actor.role === 'client') {
      // notify admin
      const company = await prisma.company.findUnique({ where: { id: ticket.company_id } })
      if (company?.assigned_admin_id) {
        const admin = await prisma.user.findUnique({ where: { id: company.assigned_admin_id } })
        if (admin) email.sendCommentNotification(admin.email, admin.name, { ticket_number: ticket.ticket_number, title: ticket.title }, true).catch(() => {})
      }
    } else {
      // notify client
      const raiser = await prisma.user.findUnique({ where: { id: ticket.raised_by } })
      if (raiser) email.sendCommentNotification(raiser.email, raiser.name, { ticket_number: ticket.ticket_number, title: ticket.title }, false).catch(() => {})
    }
  }

  return getTicketById(ticketId)
}

export async function deleteTicket(actor: JwtPayload, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw { status: 404, message: 'Ticket not found' }
  await prisma.ticket.delete({ where: { id: ticketId } })
}

export async function uploadAttachment(
  actor: JwtPayload,
  ticketId: string,
  file: Express.Multer.File
) {
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
      actor_role: actor.role,
      activity_type: 'attachment_added',
      new_value: file.originalname,
    },
  })
  return attachment
}
