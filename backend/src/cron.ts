import cron from 'node-cron'
import { sendDailyReport, sendMonthlyReport, sendStartupNotification } from './services/telegram.service'

function nextFireTime(expression: string, timezone: string): string {
  try {
    const task = cron.schedule(expression, () => {}, { timezone })
    const next = (task as any).timeMatcher?.getNextMatch(new Date())
    task.stop()
    if (!next) return 'unknown'
    return next.toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: timezone,
    }) + ' IST'
  } catch {
    return 'unknown'
  }
}

export function startCronJobs(): void {
  const dailySchedule   = process.env.CRON_SCHEDULE || '0 9 * * *'
  const monthlySchedule = '0 9 * * 2'  // every Tuesday at 9:00 AM
  const TZ = 'Asia/Kolkata'

  cron.schedule(dailySchedule, async () => {
    console.log('[cron] Sending daily Telegram report...')
    try {
      await sendDailyReport()
      console.log('[cron] Daily report sent successfully')
    } catch (err) {
      console.error('[cron] Failed to send daily report:', err)
    }
  }, { timezone: TZ })

  cron.schedule(monthlySchedule, async () => {
    console.log('[cron] Sending monthly Telegram report (last 30 days)...')
    try {
      await sendMonthlyReport()
      console.log('[cron] Monthly report sent successfully')
    } catch (err) {
      console.error('[cron] Failed to send monthly report:', err)
    }
  }, { timezone: TZ })

  const nextDaily = nextFireTime(dailySchedule, TZ)
  console.log(`[cron] Daily report  : ${dailySchedule} (${TZ}) — next: ${nextDaily}`)
  console.log(`[cron] Monthly report: ${monthlySchedule} — every Tuesday 9 AM (${TZ})`)

  // Send a startup notification so Railway deployments are immediately verifiable
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId   = process.env.TELEGRAM_CHAT_ID
  if (botToken && chatId) {
    sendStartupNotification(nextDaily).catch(err =>
      console.error('[cron] Startup notification failed:', err?.message ?? err)
    )
  } else {
    console.warn('[cron] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — reports will not send')
  }
}
