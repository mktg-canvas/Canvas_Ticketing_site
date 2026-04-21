import { Response } from 'express'
import * as floorsService from '../services/floors.service'
import { AuthRequest } from '../types'

export async function listFloors(req: AuthRequest, res: Response): Promise<void> {
  try {
    const floors = await floorsService.listFloors(req.query.buildingId as string | undefined)
    res.json({ floors })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createFloor(req: AuthRequest, res: Response): Promise<void> {
  const { buildingId, name } = req.body
  if (!buildingId || !name?.trim()) { res.status(400).json({ error: 'buildingId and name required' }); return }
  try {
    const floor = await floorsService.createFloor(buildingId, name.trim())
    res.status(201).json({ floor })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateFloor(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const floor = await floorsService.updateFloor(req.params.id as string, name.trim())
    res.json({ floor })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function deactivateFloor(req: AuthRequest, res: Response): Promise<void> {
  try {
    const floor = await floorsService.deactivateFloor(req.params.id as string)
    res.json({ floor })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
