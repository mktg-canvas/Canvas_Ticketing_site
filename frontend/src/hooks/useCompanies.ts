import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useCompanies(buildingId?: string) {
  return useQuery({
    queryKey: ['companies', buildingId],
    queryFn: async () => {
      const { data } = await api.get('/companies', { params: buildingId ? { buildingId } : {} })
      return data.companies
    },
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, buildingId }: { name: string; buildingId?: string }) => {
      const { data } = await api.post('/companies', { name, buildingId })
      return data.company
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, buildingId }: { id: string; name: string; buildingId?: string }) => {
      const { data } = await api.patch(`/companies/${id}`, { name, buildingId })
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
