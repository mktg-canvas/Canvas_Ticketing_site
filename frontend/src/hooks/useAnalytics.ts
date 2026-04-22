import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { useAuthStore } from '../store/authStore'

export interface AnalyticsFilters {
  from?: string
  to?: string
  buildingId?: string
  companyId?: string
  categoryId?: string
  fmId?: string
}

export interface DimRow {
  id: string
  name: string
  open: number
  in_progress: number
  closed: number
  total: number
}

export interface MonthRow {
  month: string
  open: number
  in_progress: number
  closed: number
  total: number
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
  byCompany: DimRow[]
  byFm: DimRow[]
  byFloor: DimRow[]
  byMonth: MonthRow[]
}

export function useAnalytics(filters: AnalyticsFilters) {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.buildingId) params.set('buildingId', filters.buildingId)
  if (filters.companyId) params.set('companyId', filters.companyId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.fmId) params.set('fmId', filters.fmId)

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
