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
  <div style="background:#4f8ef7;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">
    <span style="color:white;font-size:16px">🎫</span>
  </div>
  <span style="font-weight:600;color:#e8eaf0">Canvas Workspace</span>
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

export async function sendTicketCreatedClient(to: string, name: string, t: { ticket_number: string; title: string; category: string; priority: string; created_at: string; sla_due_at?: string | null }) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#e8eaf0">Ticket Received</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">Hi ${name}, your support ticket has been successfully raised.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket Number', `<strong style="color:#4f8ef7">${t.ticket_number}</strong>`)}
      ${row('Title', t.title)}
      ${row('Category', t.category.charAt(0).toUpperCase() + t.category.slice(1))}
      ${row('Priority', t.priority.charAt(0).toUpperCase() + t.priority.slice(1))}
      ${row('Raised On', new Date(t.created_at).toLocaleString('en-IN'))}
    </table>
    <a href="${process.env.CLIENT_URL}/client/tickets" style="display:inline-block;margin-top:20px;background:#4f8ef7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Track your ticket →</a>
  `)
  await send(to, `[${t.ticket_number}] Ticket received — ${t.title}`, html)
}

export async function sendTicketCreatedAdmin(to: string, t: { ticket_number: string; title: string; priority: string; company: string; created_at: string }) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#e8eaf0">New Ticket Raised</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">A new support ticket requires your attention.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket', `<strong style="color:#4f8ef7">${t.ticket_number}</strong>`)}
      ${row('Company', t.company)}
      ${row('Title', t.title)}
      ${row('Priority', `<strong style="color:${t.priority === 'critical' ? '#f05252' : t.priority === 'high' ? '#f5a623' : '#e8eaf0'}">${t.priority.toUpperCase()}</strong>`)}
      ${row('Raised At', new Date(t.created_at).toLocaleString('en-IN'))}
    </table>
    <a href="${process.env.CLIENT_URL}/admin/tickets" style="display:inline-block;margin-top:20px;background:#4f8ef7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Open in Admin Panel →</a>
  `)
  await send(to, `New ticket [${t.ticket_number}] — ${t.company} — ${t.priority.toUpperCase()}`, html)
}

export async function sendStatusUpdatedClient(to: string, name: string, t: { ticket_number: string; title: string; status: string }) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#e8eaf0">Ticket Status Updated</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">Hi ${name}, your ticket status has been updated.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket', `<strong style="color:#4f8ef7">${t.ticket_number}</strong>`)}
      ${row('Title', t.title)}
      ${row('New Status', `<strong style="color:#2ecc8a">${t.status.replace(/_/g,' ').toUpperCase()}</strong>`)}
    </table>
    <a href="${process.env.CLIENT_URL}/client/tickets" style="display:inline-block;margin-top:20px;background:#4f8ef7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View ticket →</a>
  `)
  await send(to, `[${t.ticket_number}] Status updated — ${t.status.replace(/_/g,' ')}`, html)
}

export async function sendTicketResolvedClient(to: string, name: string, t: { ticket_number: string; title: string; resolved_at: string }, ratingToken: string) {
  const ratingUrl = `${process.env.CLIENT_URL}/rate/${t.ticket_number}?token=${ratingToken}`
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#2ecc8a">Ticket Resolved ✓</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">Hi ${name}, your issue has been resolved.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket', `<strong style="color:#4f8ef7">${t.ticket_number}</strong>`)}
      ${row('Title', t.title)}
      ${row('Resolved On', new Date(t.resolved_at).toLocaleString('en-IN'))}
    </table>
    <p style="font-size:14px;color:#8b92a5;margin:20px 0 12px">How satisfied are you with the resolution?</p>
    <a href="${ratingUrl}" style="display:inline-block;background:#2ecc8a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Rate your experience ★</a>
    <p style="font-size:12px;color:#565e72;margin-top:12px">This link expires in 7 days.</p>
  `)
  await send(to, `[${t.ticket_number}] Resolved — Please rate your experience`, html)
}

export async function sendCommentNotification(to: string, name: string, t: { ticket_number: string; title: string }, isClientToAdmin: boolean) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#e8eaf0">New Comment</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">Hi ${name}, a new ${isClientToAdmin ? 'client reply' : 'admin response'} was added to your ticket.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket', `<strong style="color:#4f8ef7">${t.ticket_number}</strong>`)}
      ${row('Title', t.title)}
    </table>
    <a href="${process.env.CLIENT_URL}/${isClientToAdmin ? 'admin' : 'client'}/tickets" style="display:inline-block;margin-top:20px;background:#4f8ef7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View thread →</a>
  `)
  await send(to, `[${t.ticket_number}] New comment — ${t.title}`, html)
}

export async function sendSLABreachAlert(to: string, t: { ticket_number: string; title: string; company: string; priority: string }) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;font-size:16px;color:#f05252">⚠ SLA Breached</h2>
    <p style="font-size:14px;color:#8b92a5;margin:0 0 20px">The following ticket has exceeded its SLA deadline.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Ticket', `<strong style="color:#f05252">${t.ticket_number}</strong>`)}
      ${row('Title', t.title)}
      ${row('Company', t.company)}
      ${row('Priority', t.priority.toUpperCase())}
    </table>
    <a href="${process.env.CLIENT_URL}/admin/tickets" style="display:inline-block;margin-top:20px;background:#f05252;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Resolve now →</a>
  `)
  await send(to, `⚠ SLA Breached [${t.ticket_number}] — ${t.company}`, html)
}
