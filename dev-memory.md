# Canvas Workspace — Development Memory Log

> Auto-updated after every git commit via `.githooks/post-commit`

---

## Project
**Canvas Workspace — Client Ticket Management System**
- Stack: React (Vite 8 + rolldown) + Tailwind CSS | Express.js + TypeScript + Prisma v7 | PostgreSQL (Supabase) + Upstash Redis
- Storage: Supabase Storage (bucket: `attachments`)
- Email: Nodemailer + SendGrid SMTP
- Auth: JWT (15-min access token in memory + 7-day refresh token in httpOnly cookie)
- Theme: Dark UI with CSS token system (`bg0–bg4`, `txt1–3`, accent `#4f8ef7`)
- Auth: Single `/login` — role auto-detected from DB, redirects to correct portal

## Roles
- **Client** — raises tickets, views own, submits ratings
- **Admin** — manages assigned company tickets (mobile-first)
- **Super Admin** — global view, account management, analytics

## Ticket Statuses
`open` → `acknowledged` → `in_progress` → `on_hold` → `resolved` → `closed`

## SLA Deadlines (from creation)
- Critical: 4h | High: 8h | Medium: 24h | Low: 72h

---

## ✅ COMPLETED

### Phase 1 — Foundation
- [x] Monorepo structure (`/frontend`, `/backend`)
- [x] Express + TypeScript backend on port 3001
- [x] Prisma v7 with `prisma.config.ts` (`defineConfig`, `@prisma/adapter-pg`)
- [x] All 7 DB models: Company, User, Ticket, TicketActivity, Attachment, Rating, Notification
- [x] Supabase PostgreSQL connected (pooler + direct URL, password URL-encoded)
- [x] Upstash Redis connected (JWT refresh token storage + login lockout)
- [x] Supabase Storage bucket (`attachments`) created, file upload working
- [x] Filename sanitization in `uploadFile` (spaces → `_`, special chars stripped)
- [x] JWT auth: login, register, refresh, logout
- [x] Login lockout: 5 failed attempts → 15-min Redis lock
- [x] OTP-based password reset flow (backend only)
- [x] Role-based route protection (`ProtectedRoute`)

### Phase 2 — Ticket Core
- [x] Ticket creation with attachments (multipart/form-data via Multer)
- [x] Ticket number format: `CW-YYYY-XXXX`
- [x] SLA deadline auto-calculated on creation
- [x] Ticket listing with role-based scoping (client: own, admin: company, super_admin: all)
- [x] Ticket detail view with full activity log
- [x] Status update (admin/super_admin) with activity log entry
- [x] Assign ticket to admin
- [x] Add comment (public) / internal note (admin-only, amber border)
- [x] Post-creation file upload endpoint
- [x] `StatusBadge`, `PriorityDot`, `SLAChip` (green/amber/red countdown) components

### Phase 3 — UI Pages
- [x] Login page (single, role-auto-redirect)
- [x] Register page
- [x] Client Dashboard
- [x] Client: Raise Ticket (with file attachments)
- [x] Client: My Tickets list
- [x] Client: Ticket Detail
- [x] Admin Dashboard
- [x] Admin: All Tickets list (with filters)
- [x] Admin: Ticket Detail (bottom-sheet status update, internal notes toggle)
- [x] Super Admin Dashboard
- [x] Super Admin: All Tickets
- [x] Super Admin: Accounts page (Companies / Admins / Clients tabs, create/assign/deactivate modals)

### Email System (code complete, credentials pending)
- [x] Dark-themed HTML email templates for all 6 events:
  - Ticket raised → client confirmation
  - Ticket raised → admin notification
  - Status updated → client
  - Ticket resolved → client (with rating link)
  - New comment → other party
  - SLA breach alert → admin
- [x] Emails fire async (`.catch(() => {})`) — never block API response
- ⚠️ **SendGrid API key not configured** — emails silently fail until key is added

### Infrastructure
- [x] Git repo: `https://github.com/mktg-canvas/Canvas_Ticketing_site.git`
- [x] Commits from personal account: `AryanTN05` / `aryansree2003@gmail.com`
- [x] `.githooks/post-commit` auto-updates this file

---

## ❌ PENDING

### High Priority
- [ ] **SendGrid setup**: Add `SENDGRID_API_KEY` to `.env`, verify sender email (`EMAIL_FROM`)
- [ ] **Forgot Password UI**: `/forgot-password` page (backend OTP flow exists, no frontend page)
- [ ] **Rating page**: `/rate/:ticketNumber?token=` — client submits star rating from email link

### Phase 4 — Ratings & Feedback
- [ ] Rating token validation on backend (`/api/tickets/:id/rate`)
- [ ] Star rating submit UI (5-star, comment field)
- [ ] Display rating in ticket detail (admin view)
- [ ] Auto-close ticket 7 days after resolution if no rating submitted
- [ ] Rating summary on dashboards

### Phase 5 — Analytics Dashboard
- [ ] KPI strip: total tickets, open, resolved, avg resolution time, SLA compliance %
- [ ] Bar chart: tickets by company (super admin)
- [ ] SLA compliance progress bars per priority
- [ ] Resolution time trend card
- [ ] Rating distribution chart
- [ ] CSV/Excel export button
- [ ] Charts hidden on mobile (admin mobile view stays clean)

### Other
- [ ] SLA breach cron job: check overdue tickets hourly, email assigned admin + CC super admin
- [ ] Weekly/monthly PDF report emails (configurable by super admin)
- [ ] Admin client management screen: `/admin/clients` — list company clients, deactivate

---

## Known Issues / Gotchas
- **Vite 8 (rolldown)**: Requires `import type { X }` for TypeScript interfaces — `import { X }` causes white screen
- **Prisma v7**: No `url`/`directUrl` in `schema.prisma`. Must use `prisma.config.ts` with `defineConfig`
- **macOS port 5000**: Conflicts with AirPlay Receiver. Backend runs on **3001**
- **Supabase Storage keys**: Spaces in filenames cause 400 error — sanitization is mandatory
- **DB password**: Contains `@` — must be URL-encoded as `%40` in connection strings
- **New clients**: Must be assigned to a company before raising tickets (done via Super Admin Accounts page)

---

## Commit History

<!-- Auto-appended by .githooks/post-commit — do not edit below this line manually -->
