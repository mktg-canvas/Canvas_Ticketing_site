import { Response } from 'express'
import * as companiesService from '../services/companies.service'
import { AuthRequest } from '../types'

export async function listCompanies(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const companies = await companiesService.listCompanies()
    res.json({ companies })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createCompany(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const company = await companiesService.createCompany(name.trim())
    res.status(201).json({ company })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateCompany(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const company = await companiesService.updateCompany(req.params.id as string, name.trim())
    res.json({ company })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function deactivateCompany(req: AuthRequest, res: Response): Promise<void> {
  try {
    const company = await companiesService.deactivateCompany(req.params.id as string)
    res.json({ company })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function addCompanyLocation(req: AuthRequest, res: Response): Promise<void> {
  const { buildingId, floorId } = req.body
  if (!buildingId || !floorId) { res.status(400).json({ error: 'buildingId and floorId required' }); return }
  try {
    const location = await companiesService.addCompanyLocation(req.params.id as string, buildingId, floorId)
    res.status(201).json({ location })
  } catch (err: any) {
    if (err.code === 'P2002') { res.status(409).json({ error: 'This building + floor is already linked to the company' }); return }
    res.status(500).json({ error: err.message })
  }
}

export async function removeCompanyLocation(req: AuthRequest, res: Response): Promise<void> {
  try {
    await companiesService.removeCompanyLocation(req.params.locationId as string)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
