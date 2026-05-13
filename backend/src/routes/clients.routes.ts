import { Router } from 'express'
import * as clients from '../controllers/clients.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/', clients.listClients)
router.post('/', authorize('super_admin'), clients.createClient)
router.patch('/:id', authorize('super_admin'), clients.updateClient)
router.patch('/:id/deactivate', authorize('super_admin'), clients.deactivateClient)
router.post('/:id/locations', authorize('super_admin'), clients.addClientLocation)
router.delete('/:id/locations/:locationId', authorize('super_admin'), clients.removeClientLocation)

export default router
