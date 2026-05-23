---
name: canvas
description: "Complete reference for the Canvas ticketing site — stack, domain model, roles, ticket lifecycle, analytics, and key decisions"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7c618186-3d5c-4da7-b80e-d0f309127b18
---

# Canvas — Ticketing Site

A facility management ticketing platform for property teams.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind, React Query (staleTime 30s), Zustand (authStore), React Router v6 (lazy pages), Recharts, Axios |
| Backend | Node.js + Express + TypeScript, Prisma ORM |
| Database | PostgreSQL |
| File storage | Supabase Storage (`lib/supabaseStorage.ts`) |
| Cache | Upstash Redis (`lib/redis.ts`) — 2-min TTL on analytics |
| Auth | JWT — 15-min access tokens + 30-day refresh tokens (`lib/jwt.ts`) |
| Deploy | Railway (backend), Vercel (frontend) |

---

## File Structure

```
backend/src/
  controllers/   — request parsing + Zod validation, calls services
  services/      — all business logic
  routes/        — Express router wiring + middleware chains
  middleware/    — authenticate, authorize, rateLimiter, upload (multer)
  lib/           — jwt, prisma, redis, rlsContext, supabaseStorage, sla, email

frontend/src/
  pages/
    auth/        — Login
    cem/         — Dashboard, RaiseTicket, AllTickets, TicketDetail
    admin/       — Dashboard, AllTickets, Accounts, Analytics
  components/shared/ — AdminNav, KanbanBoard, GlobalSearch, ProtectedRoute,
                       ProfileMenu, AnalyticsReportPDF
  store/         — authStore (Zustand)
  hooks/         — custom React hooks
```

---

## Domain Model

```
Building (1) ──→ Floor (many)
Client   (1) ──→ ClientLocation (many) ──→ Building + Floor
                 (client_id + building_id + floor_id — unique together)

Ticket ──→ Building, Floor, Client, Category, User (raised_by)
       ──→ TicketActivity[]   (audit log, ordered ASC)
       ──→ Attachment[]       (files in Supabase Storage)
```

---

## User Roles

| DB enum | UI label | Access |
|---|---|---|
| `cem` | CEM | Sees only own tickets (`raised_by = actor.userId`, enforced server-side) |
| `super_admin` | **Admin** | Sees all tickets across all buildings/clients/CEMs |

- DB enum stays `super_admin` — all backend `role === 'super_admin'` checks and `authorize('super_admin')` remain as-is
- UI always shows "Admin" — never "Super Admin" in copy or route paths
- Routes: `/cem/*` for CEMs, `/admin/*` for Admins (legacy `/fm/*` → `/cem/*`, `/superadmin/*` → `/admin/*` redirects kept)
- On login: Admin lands on `/admin/analytics`; CEM lands on `/cem/dashboard`

---

## Ticket Lifecycle

Status flow: `open → in_progress → closed`

Each transition:
- Logged in `TicketActivity` (`old_value` / `new_value`, optional `comment`)
- Timestamps set once, never overwritten: `opened_at`, `in_progress_at`, `closed_at`
- Per-stage notes: `open_note`, `in_progress_note`, `closed_note` (editable independently via `updateStageNote`)

Key ticket fields:
- `ticket_number` — auto-increment int, assigned by DB sequence
- `source` — `client` (reported by client) or `cem` (observed by CEM)
- `is_priority` — floats tickets to top of all lists (`ORDER BY is_priority DESC, created_at DESC`)
- `sub_category` — optional free-text under the main Category

TicketActivity types: `created`, `status_changed`, `comment_added`, `note_added`, `attachment_added`, `attachment_deleted`, `closed`
`is_internal: true` = internal note; `false` = visible comment

---

## Raise-Ticket Flow (ClientLocation)

`ClientLocation` maps a client to a specific building+floor pair (unique together).
- Selecting a client in the form auto-fills building + floor to only those the client occupies
- Clients with multiple locations get a manual picker
- Clients with zero locations → "Others mode" (`isOthersMode` flag) — free building+floor selection
- 25 mapped clients + 1 "Others" client seeded via `npm run db:seed-locations`
- 9 buildings with floors: Ground/1st/2nd/3rd/4th + Basement/Terrace/Common Area
- `FLOOR_ORDER` constant controls display sort order in the frontend

---

## Analytics

Single `getAnalytics()` call in `analytics.service.ts` fires ~12 parallel DB queries:
- Status counts (summary: total, open, in_progress, closed + avg resolution hours)
- `groupByField()` for building, category, client, CEM (`raised_by`), floor — counts split by status × source
- Raw SQL monthly trend (DATE_TRUNC month, grouped by status + source)
- Raw SQL avg resolution hours (closed_at − opened_at for closed tickets)
- Source breakdown (client vs cem)

Filters: `from`, `to`, `buildingId`, `clientId`, `categoryId`, `cemId`, `source`
Cached in Redis for 2 minutes per user+filters combo (key: `analytics:{userId}:{role}:{filters}`)

**Analytics page UI (admin):** Three horizontally-scrollable entity card rows (CEMs, Clients, Buildings) above the chart section. Each card shows name, total count, status pills (Open/IP/Closed), source pills (Client/CEM). Clicking a pill filters a DrilldownPanel to that status/source; clicking the card body shows all tickets.

**Admin-raisers fix:** `analytics.service.ts` fetches all users (not just `role: 'cem'`) so admins who raised tickets appear in the CEM card row. Frontend filter dropdown matches (`cems = allUsers`). `toDimRows` gates via `map.has(id)` so non-raisers don't appear.

---

## Auth Flow

- `AuthProvider` (App.tsx) silently calls `/api/auth/refresh` on mount to rehydrate session
- Access token in Zustand; refresh token in both Zustand and httpOnly cookie
- `authenticate` middleware verifies Bearer token, sets `req.user`, runs `rlsStore` context
- `authorize(...roles)` middleware gates routes by role
- **RLS:** `lib/rlsContext.ts` uses `AsyncLocalStorage` to carry `userId` + `role`; raw SQL queries wrap with `set_config('app.current_user_id', ...)` inside a Prisma `$transaction`

---

## SLA (`lib/sla.ts`)

Defined but partially wired. Windows: critical (1h ack / 4h resolve), high (2h/8h), medium (4h/24h), low (8h/72h). `getSlaDeadline` and `getSlaStatus` exist but full enforcement is not yet active.

---

## Key Rules

- **Never push to main without explicit confirmation.** Even if the user says "do it", confirm which step they mean before any `git push origin main` or merge to main. This rule exists because a prior "do it" was misread as approval to push to production.
- **UI role label is "Admin", route prefix is `/admin/`, DB/code value is `super_admin`** — never mix these up.
