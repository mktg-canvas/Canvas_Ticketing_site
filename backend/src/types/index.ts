import { Request } from 'express'

export type Role = 'client' | 'admin' | 'super_admin'

export interface JwtPayload {
  userId: string
  role: Role
  companyId?: string
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}
