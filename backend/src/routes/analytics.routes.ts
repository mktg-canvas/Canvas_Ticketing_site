import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { getAnalytics } from '../controllers/analytics.controller'

const router = Router()

router.use(authenticate)
router.get('/', authorize('super_admin'), getAnalytics)

export default router
