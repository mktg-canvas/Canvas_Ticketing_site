import { Response } from 'express'
import * as categoriesService from '../services/categories.service'
import { AuthRequest } from '../types'

export async function listCategories(req: AuthRequest, res: Response): Promise<void> {
  try {
    const categories = await categoriesService.listCategories()
    res.json({ categories })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name, slug } = req.body
  if (!name?.trim() || !slug?.trim()) { res.status(400).json({ error: 'name and slug required' }); return }
  try {
    const category = await categoriesService.createCategory(name.trim(), slug.trim().toLowerCase())
    res.status(201).json({ category })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return }
  try {
    const category = await categoriesService.updateCategory(req.params.id as string, name.trim())
    res.json({ category })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function deactivateCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const category = await categoriesService.deactivateCategory(req.params.id as string)
    res.json({ category })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
