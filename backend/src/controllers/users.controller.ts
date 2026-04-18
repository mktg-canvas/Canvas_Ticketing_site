import { Response } from 'express'
import { z } from 'zod'
import * as usersService from '../services/users.service'
import { AuthRequest } from '../types'

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['client', 'admin', 'super_admin']),
  companyId: z.string().uuid().optional(),
})

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await usersService.listUsers(req.user!.role, req.user!.userId)
    res.json({ users })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  // Only super_admin can create admin accounts
  if (parsed.data.role === 'admin' && req.user!.role !== 'super_admin') {
    res.status(403).json({ error: 'Only super admin can create admin accounts' })
    return
  }

  try {
    const user = await usersService.createUser(parsed.data)
    res.status(201).json({ user })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await usersService.updateUser(req.params.id as string, req.body)
    res.json({ user })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function deactivateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await usersService.deactivateUser(req.params.id as string)
    res.json({ user })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
