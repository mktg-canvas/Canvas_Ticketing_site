import { Router } from 'express'
import * as tickets from '../controllers/tickets.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload'

const router = Router()

router.use(authenticate)

router.post('/', authorize('client'), upload.array('files', 5), tickets.createTicket)
router.get('/', tickets.listTickets)
router.get('/:id', tickets.getTicket)
router.patch('/:id/status', authorize('admin', 'super_admin'), tickets.updateStatus)
router.patch('/:id/assign', authorize('admin', 'super_admin'), tickets.assignTicket)
router.post('/:id/comments', tickets.addComment)
router.post('/:id/attachments', upload.single('file'), tickets.uploadAttachment)

export default router
