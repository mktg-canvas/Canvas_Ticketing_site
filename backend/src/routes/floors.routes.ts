import { Router } from 'express'
import * as floors from '../controllers/floors.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/', floors.listFloors)
router.post('/', authorize('super_admin'), floors.createFloor)
router.patch('/:id', authorize('super_admin'), floors.updateFloor)
router.patch('/:id/deactivate', authorize('super_admin'), floors.deactivateFloor)

export default router
