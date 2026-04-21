import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data } = await api.get('/buildings')
      return data.buildings
    },
  })
}

export function useCreateBuilding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/buildings', { name })
      return data.building
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  })
}

export function useUpdateBuilding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.patch(`/buildings/${id}`, { name })
      return data.building
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  })
}

export function useDeactivateBuilding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/buildings/${id}/deactivate`)
      return data.building
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  })
}
