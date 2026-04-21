import { Response } from 'express'
import { z } from 'zod'
import * as ticketsService from '../services/tickets.service'
import { AuthRequest } from '../types'

const createSchema = z.object({
  buildingId: z.string().uuid(),
  floorId: z.string().uuid(),
  companyId: z.string().uuid(),
  categoryId: z.string().uuid(),
  subCategory: z.string().max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
})

const statusSchema = z.object({
  status: z.enum(['open','in_progress','closed']),
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
      category: req.query.category as string,
      buildingId: req.query.buildingId as string,
      floorId: req.query.floorId as string,
      companyId: req.query.companyId as string,
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
    const ticket = await ticketsService.updateTicketStatus(req.user!, req.params.id as string, parsed.data.status, parsed.data.comment)
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
