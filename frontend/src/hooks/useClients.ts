import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients')
      return data.clients
    },
    staleTime: 0, // always re-fetch on mount so locations are always current
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data } = await api.post('/clients', { name })
      return data.client
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.patch(`/clients/${id}`, { name })
      return data.client
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeactivateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/clients/${id}/deactivate`)
      return data.client
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useAddClientLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, buildingId, floorId }: { clientId: string; buildingId: string; floorId: string }) => {
      const { data } = await api.post(`/clients/${clientId}/locations`, { buildingId, floorId })
      return data.location
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useRemoveClientLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, locationId }: { clientId: string; locationId: string }) => {
      await api.delete(`/clients/${clientId}/locations/${locationId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
