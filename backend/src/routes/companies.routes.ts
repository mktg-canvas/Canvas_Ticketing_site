import { Router } from 'express'
import * as companies from '../controllers/companies.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.get('/', companies.listCompanies)
router.post('/', authorize('super_admin'), companies.createCompany)
router.patch('/:id', authorize('super_admin'), companies.updateCompany)
router.patch('/:id/deactivate', authorize('super_admin'), companies.deactivateCompany)
router.post('/:id/locations', authorize('super_admin'), companies.addCompanyLocation)
router.delete('/:id/locations/:locationId', authorize('super_admin'), companies.removeCompanyLocation)

export default router
