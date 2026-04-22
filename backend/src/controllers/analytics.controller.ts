import { Response } from 'express'
import { AuthRequest } from '../types'
import * as analyticsService from '../services/analytics.service'

export async function getAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { from, to, buildingId, companyId, categoryId, fmId } = req.query

    const filters: analyticsService.AnalyticsFilters = {}
    if (from && typeof from === 'string') filters.from = new Date(from)
    if (to && typeof to === 'string') filters.to = new Date(to)
    if (buildingId && typeof buildingId === 'string') filters.buildingId = buildingId
    if (companyId && typeof companyId === 'string') filters.companyId = companyId
    if (categoryId && typeof categoryId === 'string') filters.categoryId = categoryId
    if (fmId && typeof fmId === 'string') filters.fmId = fmId

    const data = await analyticsService.getAnalytics(filters)
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
