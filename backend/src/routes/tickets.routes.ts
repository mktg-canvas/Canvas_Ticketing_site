import { Router } from 'express'
import * as tickets from '../controllers/tickets.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { upload, handleUploadError } from '../middleware/upload'

const router = Router()

router.use(authenticate)

router.post('/', authorize('cem', 'super_admin'), upload.array('files', 5), handleUploadError, tickets.createTicket)
router.get('/', tickets.listTickets)
router.get('/:id', tickets.getTicket)
router.patch('/:id', authorize('super_admin'), tickets.editTicket)
router.delete('/:id', authorize('super_admin'), tickets.deleteTicket)
router.patch('/:id/status', authorize('cem', 'super_admin'), tickets.updateStatus)
router.post('/:id/comments', authorize('cem', 'super_admin'), tickets.addComment)
router.patch('/:id/stage-note', authorize('cem', 'super_admin'), tickets.updateStageNote)
router.post('/:id/attachments', authorize('cem', 'super_admin'), upload.single('file'), handleUploadError, tickets.uploadAttachment)
router.delete('/:id/attachments/:attachmentId', authorize('cem', 'super_admin'), tickets.deleteAttachment)

export default router
