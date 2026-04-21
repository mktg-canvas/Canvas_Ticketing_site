import { Router } from 'express'
import * as buildings from '../controllers/buildings.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/', buildings.listBuildings)
router.post('/', authorize('super_admin'), buildings.createBuilding)
router.patch('/:id', authorize('super_admin'), buildings.updateBuilding)
router.patch('/:id/deactivate', authorize('super_admin'), buildings.deactivateBuilding)

export default router
