---
name: Canvas Ticketing Site - Project Overview
description: Architecture and key design decisions for the Canvas Workspace ticketing application
type: project
---

Canvas is a facility-management (FM) ticketing web app. Two roles: `fm` (raises tickets) and `super_admin` (manages everything).

**Stack**
- Backend: Express 5 + TypeScript, Prisma ORM (PostgreSQL), Upstash Redis, Supabase Storage, Nodemailer/SendGrid, deployed on Railway
- Frontend: React + Vite + TypeScript, TanStack Query, Zustand, Tailwind, deployed on Vercel

**Domain model (Prisma)**
- Building → Floor (cascade delete)
- Company (optional building FK, SetNull on delete)
- Category (slugged, active flag)
- User (roles: fm | super_admin, bcrypt password)
- Ticket (ticket_number unique, FK to building/floor/company/category/user, status: open|in_progress|closed, timestamps per status)
- TicketActivity (audit log: created/status_changed/comment_added/note_added/attachment_added/closed, supports internal notes)
- Attachment (file stored in Supabase Storage)

**Auth flow**
- Access token: 15-min JWT in Authorization header (not persisted in localStorage)
- Refresh token: 7-day JWT stored in httpOnly cookie AND in Redis (key: `refresh:<userId>`) for server-side revocation
- Rate-limit / lockout: Redis tracks failed login attempts; locks account for 15 min after 5 failures
- OTP password reset: 6-digit OTP stored in Redis with 10-min TTL
- Frontend axios instance auto-refreshes with a queue to avoid parallel refresh races

**Frontend routing**
- `/fm/*` — protected to `fm` role: dashboard, raise-ticket, tickets list, ticket detail
- `/superadmin/*` — protected to `super_admin` role: dashboard, all-tickets, accounts, analytics
- Auth state in Zustand (persisted user profile only, never token)

**Analytics**
- Aggregates by building, category, company, FM user, floor, and monthly trend
- Calculates avg resolution hours from opened_at → closed_at
- Supports date-range + dimension filters

**SLA**
- Defined in `src/lib/sla.ts`: critical=4h, high=8h, medium=24h, low=72h resolve targets
- getSlaStatus returns green/amber/red (amber = <2h remaining)

**Why:** Understand full scope before suggesting changes.
**How to apply:** Use this as the canonical mental model when making architecture or feature suggestions.
