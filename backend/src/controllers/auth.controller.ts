import { Request, Response } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service'
import { AuthRequest } from '../types'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
})

const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
})

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(
      parsed.data.email,
      parsed.data.password
    )

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken, user })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Login failed' })
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const user = await authService.registerClient(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password
    )
    res.status(201).json({ user })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Registration failed' })
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken
  if (!token) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }

  try {
    const { accessToken, user } = await authService.refreshAccessToken(token)
    res.json({ accessToken, user })
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Token refresh failed' })
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  if (req.user) await authService.logoutUser(req.user.userId)
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out' })
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body
  if (!email) {
    res.status(400).json({ error: 'Email required' })
    return
  }

  try {
    await authService.sendPasswordResetOtp(email)
    // Always return same message to prevent email enumeration
    res.json({ message: 'If that email exists, an OTP has been sent.' })
  } catch {
    res.json({ message: 'If that email exists, an OTP has been sent.' })
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    await authService.resetPassword(
      parsed.data.email,
      parsed.data.otp,
      parsed.data.password
    )
    res.json({ message: 'Password reset successful' })
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Reset failed' })
  }
}
