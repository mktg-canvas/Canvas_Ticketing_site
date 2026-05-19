import { Response } from 'express'
import { AuthRequest } from '../types'
import * as analyticsService from '../services/analytics.service'
import { redis } from '../lib/redis'

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

    const cacheKey = `analytics:${req.user!.userId}:${req.user!.role}:${JSON.stringify(filters)}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        res.json(cached)
        return
      }
    } catch { /* Redis unavailable — fall through to DB */ }

    const data = await analyticsService.getAnalytics(filters)

    try {
      await redis.set(cacheKey, data, { ex: 120 })
    } catch { /* Redis unavailable — continue without caching */ }

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
