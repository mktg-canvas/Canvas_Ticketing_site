import { Response } from 'express'
import * as companiesService from '../services/companies.service'
import { AuthRequest } from '../types'

export async function listCompanies(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companies = await companiesService.listCompanies(req.query.buildingId as string | undefined)
    res.json({ companies })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createCompany(req: AuthRequest, res: Response): Promise<void> {
  const { name, buildingId } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const company = await companiesService.createCompany(name.trim(), buildingId)
    res.status(201).json({ company })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateCompany(req: AuthRequest, res: Response): Promise<void> {
  const { name, buildingId } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const company = await companiesService.updateCompany(req.params.id as string, name.trim(), buildingId)
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
