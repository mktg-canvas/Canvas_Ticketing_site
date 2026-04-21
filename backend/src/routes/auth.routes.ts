import { Router } from 'express'
import * as auth from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post('/login', authLimiter, auth.login)
router.post('/refresh', auth.refresh)
router.post('/logout', authenticate, auth.logout)
router.post('/forgot-password', authLimiter, auth.forgotPassword)
router.post('/reset-password', authLimiter, auth.resetPassword)

export default router
