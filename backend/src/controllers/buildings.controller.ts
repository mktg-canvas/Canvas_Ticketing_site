import { Response } from 'express'
import * as buildingsService from '../services/buildings.service'
import { AuthRequest } from '../types'

export async function listBuildings(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const buildings = await buildingsService.listBuildings()
    res.json({ buildings })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createBuilding(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const building = await buildingsService.createBuilding(name.trim())
    res.status(201).json({ building })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateBuilding(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const building = await buildingsService.updateBuilding(req.params.id as string, name.trim())
    res.json({ building })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function deactivateBuilding(req: AuthRequest, res: Response): Promise<void> {
  try {
    const building = await buildingsService.deactivateBuilding(req.params.id as string)
    res.json({ building })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
