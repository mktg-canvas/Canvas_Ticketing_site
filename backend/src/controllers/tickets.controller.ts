import { Response } from 'express'
import { z } from 'zod'
import * as ticketsService from '../services/tickets.service'
import { AuthRequest } from '../types'

const createSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(20),
  category: z.enum(['electrical','plumbing','internet','housekeeping','furniture','hvac','security','access','billing','other']),
  priority: z.enum(['low','medium','high','critical']),
})

const statusSchema = z.object({
  status: z.enum(['open','acknowledged','in_progress','on_hold','resolved','closed']),
  comment: z.string().optional(),
})

export async function createTicket(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const ticket = await ticketsService.createTicket(req.user!, {
      ...parsed.data,
      files: req.files as Express.Multer.File[],
    })
    res.status(201).json({ ticket })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function listTickets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await ticketsService.listTickets(req.user!, {
      status: req.query.status as string,
      priority: req.query.priority as string,
      category: req.query.category as string,
      companyId: req.query.companyId as string,
      assignedTo: req.query.assignedTo as string,
      page: req.query.page ? Number(req.query.page) : 1,
    })
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function getTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ticket = await ticketsService.getTicketById(req.params.id as string)
    res.json({ ticket })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function updateStatus(req: AuthRequest, res: Response): Promise<void> {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const ticket = await ticketsService.updateTicketStatus(
      req.user!,
      req.params.id as string,
      parsed.data.status,
      parsed.data.comment
    )
    res.json({ ticket })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function assignTicket(req: AuthRequest, res: Response): Promise<void> {
  const { adminId } = req.body
  if (!adminId) { res.status(400).json({ error: 'adminId required' }); return }
  try {
    const ticket = await ticketsService.assignTicket(req.user!, req.params.id as string, adminId)
    res.json({ ticket })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  const { comment, isInternal = false } = req.body
  if (!comment) { res.status(400).json({ error: 'comment required' }); return }
  try {
    const ticket = await ticketsService.addComment(req.user!, req.params.id as string, comment, isInternal)
    res.json({ ticket })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function deleteTicket(req: AuthRequest, res: Response): Promise<void> {
  try {
    await ticketsService.deleteTicket(req.user!, req.params.id as string)
    res.status(204).send()
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function uploadAttachment(req: AuthRequest, res: Response): Promise<void> {
  const file = req.file
  if (!file) { res.status(400).json({ error: 'No file uploaded' }); return }
  try {
    const attachment = await ticketsService.uploadAttachment(req.user!, req.params.id as string, file)
    res.status(201).json({ attachment })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}
