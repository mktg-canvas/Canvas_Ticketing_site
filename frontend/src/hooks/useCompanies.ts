import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies')
      return data.companies
    },
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; officeLocation?: string; assignedAdminId?: string }) => {
      const { data } = await api.post('/companies', body)
      return data.company
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; officeLocation?: string; assignedAdminId?: string }) => {
      const { data } = await api.patch(`/companies/${id}`, body)
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
