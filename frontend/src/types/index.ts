export type Role = 'client' | 'admin' | 'super_admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  companyId?: string
}

export interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'acknowledged' | 'in_progress' | 'on_hold' | 'resolved' | 'closed'
  raised_by: string
  company_id: string
  assigned_to?: string
  sla_due_at?: string
  resolved_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  raiser?: { name: string; email: string }
  company?: { name: string; office_location?: string }
  assignee?: { name: string }
}

export interface TicketActivity {
  id: string
  ticket_id: string
  actor_id: string
  actor_role: Role
  activity_type: string
  old_value?: string
  new_value?: string
  comment?: string
  is_internal: boolean
  created_at: string
  actor: { name: string }
}

export interface Company {
  id: string
  name: string
  office_location?: string
  assigned_admin_id?: string
  is_active: boolean
  created_at: string
}

export interface Rating {
  id: string
  ticket_id: string
  rating: number
  feedback?: string
  submitted_at: string
}

export interface Notification {
  id: string
  ticket_id?: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}
