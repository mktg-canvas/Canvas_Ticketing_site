import multer, { MulterError } from 'multer'
import { Request, Response, NextFunction } from 'express'

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
]

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req: Request, file, cb) {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images and PDFs allowed.'))
    }
  },
})

export function handleUploadError(err: any, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof MulterError) {
    res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10 MB)' : err.message })
  } else if (err?.message?.startsWith('Invalid file type')) {
    res.status(400).json({ error: err.message })
  } else {
    next(err)
  }
}
