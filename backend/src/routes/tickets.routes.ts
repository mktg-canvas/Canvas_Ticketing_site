import { Router } from 'express'
import * as tickets from '../controllers/tickets.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload'

const router = Router()

router.use(authenticate)

router.post('/', authorize('fm'), upload.array('files', 5), tickets.createTicket)
router.get('/', tickets.listTickets)
router.get('/:id', tickets.getTicket)
router.delete('/:id', authorize('super_admin'), tickets.deleteTicket)
router.patch('/:id/status', authorize('fm', 'super_admin'), tickets.updateStatus)
router.post('/:id/comments', authorize('fm', 'super_admin'), tickets.addComment)
router.post('/:id/attachments', authorize('fm', 'super_admin'), upload.single('file'), tickets.uploadAttachment)

export default router
