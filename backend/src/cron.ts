import cron from 'node-cron'
import { sendDailyReport, sendMonthlyReport } from './services/telegram.service'

export function startCronJobs(): void {
  const dailySchedule   = process.env.CRON_SCHEDULE || '0 9 * * *'
  const monthlySchedule = '0 9 * * 2'  // every Tuesday at 9:00 AM

  cron.schedule(dailySchedule, async () => {
    console.log('[cron] Sending daily Telegram report...')
    try {
      await sendDailyReport()
      console.log('[cron] Daily report sent successfully')
    } catch (err) {
      console.error('[cron] Failed to send daily report:', err)
    }
  }, { timezone: 'Asia/Kolkata' })

  cron.schedule(monthlySchedule, async () => {
    console.log('[cron] Sending monthly Telegram report (last 30 days)...')
    try {
      await sendMonthlyReport()
      console.log('[cron] Monthly report sent successfully')
    } catch (err) {
      console.error('[cron] Failed to send monthly report:', err)
    }
  }, { timezone: 'Asia/Kolkata' })

  console.log(`[cron] Daily report  : ${dailySchedule} (Asia/Kolkata)`)
  console.log(`[cron] Monthly report: ${monthlySchedule} — every Tuesday 9 AM (Asia/Kolkata)`)
}
