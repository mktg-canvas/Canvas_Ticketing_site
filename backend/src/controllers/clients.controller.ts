import { Response } from 'express'
import * as clientsService from '../services/clients.service'
import { AuthRequest } from '../types'

export async function listClients(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const clients = await clientsService.listClients()
    res.json({ clients })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createClient(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const client = await clientsService.createClient(name.trim())
    res.status(201).json({ client })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateClient(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const client = await clientsService.updateClient(req.params.id as string, name.trim())
    res.json({ client })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function deactivateClient(req: AuthRequest, res: Response): Promise<void> {
  try {
    const client = await clientsService.deactivateClient(req.params.id as string)
    res.json({ client })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function addClientLocation(req: AuthRequest, res: Response): Promise<void> {
  const { buildingId, floorId } = req.body
  if (!buildingId || !floorId) { res.status(400).json({ error: 'buildingId and floorId required' }); return }
  try {
    const location = await clientsService.addClientLocation(req.params.id as string, buildingId, floorId)
    res.status(201).json({ location })
  } catch (err: any) {
    if (err.code === 'P2002') { res.status(409).json({ error: 'This building + floor is already linked to the client' }); return }
    res.status(500).json({ error: err.message })
  }
}

export async function removeClientLocation(req: AuthRequest, res: Response): Promise<void> {
  try {
    await clientsService.removeClientLocation(req.params.locationId as string)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
