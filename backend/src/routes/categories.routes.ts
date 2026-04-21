import { Router } from 'express'
import * as categories from '../controllers/categories.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/', categories.listCategories)
router.post('/', authorize('super_admin'), categories.createCategory)
router.patch('/:id', authorize('super_admin'), categories.updateCategory)
router.patch('/:id/deactivate', authorize('super_admin'), categories.deactivateCategory)

export default router
