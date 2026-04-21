import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useFloors(buildingId?: string) {
  return useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      const { data } = await api.get('/floors', { params: buildingId ? { buildingId } : {} })
      return data.floors
    },
  })
}

export function useCreateFloor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ buildingId, name }: { buildingId: string; name: string }) => {
      const { data } = await api.post('/floors', { buildingId, name })
      return data.floor
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floors'] }),
  })
}

export function useUpdateFloor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data } = await api.patch(`/floors/${id}`, { name })
      return data.floor
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floors'] }),
  })
}

export function useDeactivateFloor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/floors/${id}/deactivate`)
      return data.floor
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floors'] }),
  })
}
