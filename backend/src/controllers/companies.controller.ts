import { Response } from 'express'
import * as companiesService from '../services/companies.service'
import { AuthRequest } from '../types'

export async function listCompanies(req: AuthRequest, res: Response): Promise<void> {
  try {
    const adminId = req.user!.role === 'admin' ? req.user!.userId : undefined
    const companies = await companiesService.listCompanies(adminId)
    res.json({ companies })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createCompany(req: AuthRequest, res: Response): Promise<void> {
  try {
    const company = await companiesService.createCompany(req.body)
    res.status(201).json({ company })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateCompany(req: AuthRequest, res: Response): Promise<void> {
  try {
    const company = await companiesService.updateCompany(req.params.id as string, req.body)
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
