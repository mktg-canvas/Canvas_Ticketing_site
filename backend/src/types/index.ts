import { Request } from 'express'

export type Role = 'cem' | 'super_admin'

export interface JwtPayload {
  userId: string
  role: Role
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}
