import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { useAuthStore } from '../store/authStore'

export interface AnalyticsFilters {
  from?: string
  to?: string
  buildingId?: string
  clientId?: string
  categoryId?: string
  cemId?: string
  source?: 'client' | 'cem'
}

export interface DimRow {
  id: string
  name: string
  open: number
  in_progress: number
  closed: number
  total: number
  client_total: number
  cem_total: number
  open_client: number
  in_progress_client: number
  closed_client: number
  open_cem: number
  in_progress_cem: number
  closed_cem: number
}

export interface MonthRow {
  month: string
  open: number
  in_progress: number
  closed: number
  total: number
  client_total: number
  cem_total: number
  open_client: number
  in_progress_client: number
  closed_client: number
  open_cem: number
  in_progress_cem: number
  closed_cem: number
}

export interface AnalyticsData {
  summary: {
    total: number
    open: number
    in_progress: number
    closed: number
    avgResolutionHours: number | null
  }
  byBuilding: DimRow[]
  byCategory: DimRow[]
  byClient: DimRow[]
  byCem: DimRow[]
  byFloor: DimRow[]
  byMonth: MonthRow[]
  bySource: DimRow[]
}

export function useAnalytics(filters: AnalyticsFilters) {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.buildingId) params.set('buildingId', filters.buildingId)
  if (filters.clientId) params.set('clientId', filters.clientId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.cemId) params.set('cemId', filters.cemId)
  if (filters.source) params.set('source', filters.source)

  const accessToken = useAuthStore(s => s.accessToken)

  return useQuery<AnalyticsData>({
    queryKey: ['analytics', filters],
    queryFn: async () => {
      const res = await api.get(`/analytics?${params.toString()}`)
      return res.data
    },
    staleTime: 60_000,
    retry: false,
    enabled: !!accessToken,
  })
}
