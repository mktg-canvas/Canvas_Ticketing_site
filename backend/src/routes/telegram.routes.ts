import { Router, Request, Response } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { sendDailyReport, sendMonthlyReport } from '../services/telegram.service'

const router = Router()

// POST /api/telegram/send-report  — admin only, triggers a report on demand
router.post('/send-report', authenticate, authorize('super_admin'), async (req: Request, res: Response) => {
  const type = (req.body?.type as string) || 'daily'
  if (type !== 'daily' && type !== 'monthly') {
    res.status(400).json({ error: 'type must be "daily" or "monthly"' })
    return
  }

  try {
    if (type === 'daily') {
      await sendDailyReport()
    } else {
      await sendMonthlyReport()
    }
    res.json({ ok: true, message: `${type} report sent to Telegram` })
  } catch (err: any) {
    console.error('[telegram] Manual send failed:', err)
    res.status(500).json({
      error: 'Failed to send report',
      detail: err?.response?.data?.description ?? err?.message ?? 'Unknown error',
    })
  }
})

export default router
