import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies')
      return data.companies
    },
    staleTime: 0, // always re-fetch on mount so locations are always current
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data } = await api.post('/companies', { name })
      return data.company
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.patch(`/companies/${id}`, { name })
      return data.company
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useDeactivateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/companies/${id}/deactivate`)
      return data.company
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useAddCompanyLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ companyId, buildingId, floorId }: { companyId: string; buildingId: string; floorId: string }) => {
      const { data } = await api.post(`/companies/${companyId}/locations`, { buildingId, floorId })
      return data.location
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useRemoveCompanyLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ companyId, locationId }: { companyId: string; locationId: string }) => {
      await api.delete(`/companies/${companyId}/locations/${locationId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}
