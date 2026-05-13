import { Response } from 'express'
import { AuthRequest } from '../types'
import * as analyticsService from '../services/analytics.service'

export async function getAnalytics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { from, to, buildingId, clientId, categoryId, cemId, source } = req.query

    const filters: analyticsService.AnalyticsFilters = {}
    if (from && typeof from === 'string') filters.from = new Date(from)
    if (to && typeof to === 'string') filters.to = new Date(to)
    if (buildingId && typeof buildingId === 'string') filters.buildingId = buildingId
    if (clientId && typeof clientId === 'string') filters.clientId = clientId
    if (categoryId && typeof categoryId === 'string') filters.categoryId = categoryId
    if (cemId && typeof cemId === 'string') filters.cemId = cemId
    if (source === 'client' || source === 'cem') filters.source = source

    const data = await analyticsService.getAnalytics(filters)
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
