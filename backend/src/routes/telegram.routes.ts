import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { sendDailyReport, sendMonthlyReport } from '../services/telegram.service'

const router = Router()

async function runReport(type: string, res: Response): Promise<void> {
  if (type !== 'daily' && type !== 'monthly') {
    res.status(400).json({ error: 'type must be "daily" or "monthly"' })
    return
  }
  try {
    if (type === 'daily') await sendDailyReport()
    else await sendMonthlyReport()
    res.json({ ok: true, message: `${type} report sent to Telegram` })
  } catch (err: any) {
    console.error('[telegram] Send failed:', err)
    res.status(500).json({
      error: 'Failed to send report',
      detail: err?.response?.data?.description ?? err?.message ?? 'Unknown error',
    })
  }
}

// Shared-secret guard for Cloud Scheduler (no user session). Scheduler sends the
// secret in the `x-cron-secret` header; we reject anything that doesn't match.
function verifyCronSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    res.status(500).json({ error: 'CRON_SECRET is not configured on the server' })
    return
  }
  if (req.get('x-cron-secret') !== expected) {
    res.status(401).json({ error: 'Invalid cron secret' })
    return
  }
  next()
}

// POST /api/telegram/cron/:type  — called by Cloud Scheduler (daily | monthly)
router.post('/cron/:type', verifyCronSecret, async (req: Request, res: Response) => {
  await runReport(String(req.params.type), res)
})

// POST /api/telegram/send-report  — admin only, triggers a report on demand
router.post('/send-report', authenticate, authorize('super_admin'), async (req: Request, res: Response) => {
  await runReport((req.body?.type as string) || 'daily', res)
})

export default router
