import nodemailer from 'nodemailer'

function getTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    })
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

async function send(to: string, subject: string, html: string) {
  try {
    const transporter = getTransporter()
    await transporter.sendMail({ from: `Canvas Workspace <${process.env.EMAIL_FROM}>`, to, subject, html })
  } catch (err) {
    console.error('[Email] Failed to send to', to, err)
  }
}

function wrap(content: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#0f1117;color:#e8eaf0;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#181c24;border:1px solid #2e3545;border-radius:12px;padding:24px">
<div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #2e3545">
  <span style="font-weight:600;color:#e8eaf0;font-size:16px">Canvas Workspace</span>
</div>
${content}
<div style="margin-top:24px;padding-top:16px;border-top:1px solid #2e3545;font-size:12px;color:#565e72">
  Canvas Workspace Support Team · Do not reply to this email
</div>
</div></body></html>`
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;font-size:13px;color:#8b92a5;width:140px">${label}</td><td style="padding:6px 0;font-size:13px;color:#e8eaf0">${value}</td></tr>`
}

export async function sendTicketCreated(to: string, fmName: string, t: {
  ticket_number: string
  building: string
  floor: string
  company: string
  category: string
  created_at: string
}) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#e8eaf0">Ticket Raised</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">Hi ${fmName}, your ticket has been submitted.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket', `<strong style="color:#4f8ef7">${t.ticket_number}</strong>`)}
      ${row('Building', t.building)}
      ${row('Floor', t.floor)}
      ${row('Company', t.company)}
      ${row('Category', t.category.charAt(0).toUpperCase() + t.category.slice(1))}
      ${row('Raised On', new Date(t.created_at).toLocaleString('en-IN'))}
    </table>
    <a href="${process.env.CLIENT_URL}/fm/tickets" style="display:inline-block;margin-top:20px;background:#4f8ef7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View ticket →</a>
  `)
  await send(to, `[${t.ticket_number}] Ticket raised`, html)
}
