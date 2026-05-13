import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

export function useTickets(filters: Record<string, string | number | boolean | undefined> = {}) {
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

export function useEditTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      buildingId?: string
      floorId?: string
      clientId?: string
      categoryId?: string
      subCategory?: string
      description?: string
      source?: 'client' | 'cem'
    }) => {
      const { data: res } = await api.patch(`/tickets/${id}`, data)
      return res.ticket
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['ticket', id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    },
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

export function useUploadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file, stage }: { id: string; file: File; stage: string | null }) => {
      const fd = new FormData()
      fd.append('file', file)
      if (stage) fd.append('stage', stage)
      const { data } = await api.post(`/tickets/${id}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.attachment
    },
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  })
}

export function useUpdateStageNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stage, note }: { id: string; stage: string; note: string }) => {
      await api.patch(`/tickets/${id}/stage-note`, { stage, note })
    },
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['ticket', id] }),
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
