import { Router } from 'express'
import * as users from '../controllers/users.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/', authorize('super_admin'), users.listUsers)
router.post('/', authorize('super_admin'), users.createUser)
router.patch('/:id', authorize('super_admin'), users.updateUser)
router.patch('/:id/deactivate', authorize('super_admin'), users.deactivateUser)

export default router
