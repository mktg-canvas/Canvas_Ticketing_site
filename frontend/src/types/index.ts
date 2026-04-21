export type Role = 'fm' | 'super_admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Building {
  id: string
  name: string
  is_active: boolean
  created_at: string
  _count?: { floors: number; tickets: number }
}

export interface Floor {
  id: string
  name: string
  building_id: string
  is_active: boolean
  created_at: string
  building?: { id: string; name: string }
  _count?: { tickets: number }
}

export interface Company {
  id: string
  name: string
  is_active: boolean
  created_at: string
  _count?: { tickets: number }
}

export interface Ticket {
  id: string
  ticket_number: string
  building_id: string
  floor_id: string
  company_id: string
  category: { id: string; name: string; slug: string } | string
  sub_category?: string
  description: string
  status: 'open' | 'in_progress' | 'closed'
  raised_by: string
  opened_at?: string
  in_progress_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  building?: { name: string }
  floor?: { name: string }
  company?: { name: string }
  raiser?: { name: string; email: string }
  _count?: { attachments: number }
}

export interface TicketActivity {
  id: string
  ticket_id: string
  actor_id: string
  activity_type: string
  old_value?: string
  new_value?: string
  comment?: string
  is_internal: boolean
  created_at: string
  actor: { name: string; role: Role }
}

export interface Attachment {
  id: string
  ticket_id: string
  file_name?: string
  file_url?: string
  file_size?: number
  mime_type?: string
  created_at: string
}
