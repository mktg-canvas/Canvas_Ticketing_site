import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { redis } from '../lib/redis'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { JwtPayload } from '../types'

const LOCK_PREFIX = 'lock:'
const FAILED_PREFIX = 'failed:'
const OTP_PREFIX = 'otp:'
const REFRESH_PREFIX = 'refresh:'
const MAX_ATTEMPTS = 5
const LOCK_DURATION = 15 * 60

export async function loginUser(email: string, password: string) {
  const lockKey = `${LOCK_PREFIX}${email}`
  const failedKey = `${FAILED_PREFIX}${email}`

  const locked = await redis.get(lockKey)
  if (locked) throw { status: 423, message: 'Account locked. Try again in 15 minutes.' }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.is_active) throw { status: 401, message: 'Invalid credentials' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    const attempts = await redis.incr(failedKey)
    await redis.expire(failedKey, LOCK_DURATION)
    if (attempts >= MAX_ATTEMPTS) {
      await redis.set(lockKey, '1', { ex: LOCK_DURATION })
      await redis.del(failedKey)
      throw { status: 423, message: 'Account locked after 5 failed attempts. Try again in 15 minutes.' }
    }
    throw { status: 401, message: 'Invalid credentials' }
  }

  await redis.del(failedKey)
  await prisma.user.update({ where: { id: user.id }, data: { last_login: new Date() } })

  const payload: JwtPayload = { userId: user.id, role: user.role as JwtPayload['role'] }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await redis.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, { ex: 7 * 24 * 60 * 60 })

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken)
  const stored = await redis.get(`${REFRESH_PREFIX}${payload.userId}`)
  if (stored !== refreshToken) throw { status: 401, message: 'Invalid refresh token' }

  const newAccessToken = signAccessToken({ userId: payload.userId, role: payload.role })
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })

  return {
    accessToken: newAccessToken,
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
  }
}

export async function logoutUser(userId: string) {
  await redis.del(`${REFRESH_PREFIX}${userId}`)
}

export async function sendPasswordResetOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  await redis.set(`${OTP_PREFIX}${email}`, otp, { ex: 10 * 60 })

  return { otp, userName: user.name }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const stored = await redis.get(`${OTP_PREFIX}${email}`)
  if (!stored || stored !== otp) throw { status: 400, message: 'Invalid or expired OTP' }

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { email }, data: { password_hash: hash } })

  const user = await prisma.user.findUnique({ where: { email } })
  if (user) await redis.del(`${REFRESH_PREFIX}${user.id}`)
  await redis.del(`${OTP_PREFIX}${email}`)
}
