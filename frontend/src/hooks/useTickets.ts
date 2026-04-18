import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useTickets(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
      const { data } = await api.get('/tickets', { params })
      return data
    },
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data } = await api.get(`/tickets/${id}`)
      return data.ticket
    },
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.ticket
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tickets/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment?: string }) => {
      const { data } = await api.patch(`/tickets/${id}/status`, { status, comment })
      return data.ticket
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, comment, isInternal }: { id: string; comment: string; isInternal: boolean }) => {
      const { data } = await api.post(`/tickets/${id}/comments`, { comment, isInternal })
      return data.ticket
    },
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  })
}

export function useAssignTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, adminId }: { id: string; adminId: string }) => {
      const { data } = await api.patch(`/tickets/${id}/assign`, { adminId })
      return data.ticket
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
