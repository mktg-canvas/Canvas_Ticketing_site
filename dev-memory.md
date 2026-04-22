# Canvas Workspace — Development Memory Log

> Auto-updated after every git commit via `.githooks/post-commit`

---

## Project
**Canvas Workspace — Facility Management / Ticketing System**
- Stack: React 19 + Vite 8 (rolldown) + Tailwind CSS 4 | Express 5 + TypeScript + Prisma 7.7 | PostgreSQL (Supabase) + Upstash Redis
- Auth: JWT (15-min access in Zustand memory + 7-day refresh in httpOnly cookie). User profile persisted in localStorage via `zustand/persist`.
- Theme: **Light default** (CSS token system: `bg0–bg4`, `txt1–txt3`, `accent #552e9e`, `success/warning/danger`). Dark available via ProfileMenu toggle. Class applied in `main.tsx` before React mounts. Storage key: `theme_v2`.
- Single `/login` route — role auto-detected, redirects to `/fm/dashboard` or `/superadmin/dashboard`.

## Roles
- **FM (Facility Manager)** — raises tickets, views tickets they raised, updates status
- **Super Admin** — global view, ticket management, account management, analytics dashboard

## Ticket Statuses
`open → in_progress → closed` (simple 3-state. No priorities, no SLA, no ratings in current build.)

## Core Entities (Prisma schema)
`User(role: fm|super_admin)` · `Building` · `Floor` · `Company` · `Category` · `Ticket` · `TicketActivity`
- Companies optionally belong to a building (nullable FK, `SetNull` on delete).
- Floors belong to a building.
- Tickets require: ticket_number, building, floor, company, category, raised_by, description, status, timestamps.

---

## ✅ COMPLETED

### Phase 1 — Foundation
- [x] Monorepo (`/frontend`, `/backend`)
- [x] Express 5 + TypeScript backend on port 3001 (macOS 5000 conflicts with AirPlay)
- [x] Prisma v7 with `prisma.config.ts` (`defineConfig`, `@prisma/adapter-pg` Driver Adapter)
- [x] Supabase PostgreSQL via PgBouncer (`?pgbouncer=true`), URL-encoded password
- [x] Upstash Redis (REST API) — JWT refresh tokens, login lockout, failed-attempt counter
- [x] JWT auth: login, refresh, logout
- [x] Login lockout: 5 failed attempts → 15-min Redis lock
- [x] Rate limiters: `generalLimiter` 500/min, `authLimiter` 10/min
- [x] Role-based route protection (`ProtectedRoute`)

### Phase 2 — Ticket & Entity Management
- [x] FM: raise ticket (Building → Floor → Company → Category → Description)
- [x] FM dashboard Kanban (Open / In Progress / Closed)
- [x] FM: My Tickets list with status filter tabs
- [x] FM: Ticket Detail with bottom-sheet status update + activity timeline
- [x] Super Admin: All Tickets list (building/company filter)
- [x] Super Admin: Accounts page (tabbed: Buildings / Floors / Companies / FMs) — full CRUD with modals
- [x] StatusBadge + TicketCard shared components
- [x] Session persistence: refresh-on-load via `/api/auth/refresh`

### Phase 3 — Analytics Dashboard (Super Admin)
- [x] `GET /api/analytics` — summary + byBuilding + byCategory + byCompany + byFm + byFloor + byMonth
- [x] Prisma raw SQL for monthly trend with conditional `WHERE` via `Prisma.join(conds, ' AND ')`
- [x] 5 KPI cards: Total / Open / In Progress / Closed / Avg Resolution
- [x] Stacked bar chart (recharts v3.8.1) with hardcoded hex colors (CSS vars unreliable in SVG)
- [x] Dimension tabs: Building / Issue Category / Company / FM / Monthly Trend
- [x] Date presets: `7 Days / 30 Days / 90 Days / All Time / Custom` with date pickers
- [x] Collapsible filter dropdowns (Building / Company / Category / FM)
- [x] Data table with `%Closed` progress bar + totals row
- [x] Empty state + error banner + retry button + not-authenticated banner

### Phase 4 — Production Hardening (2026-04-22)
- [x] **Axios interceptor fix:** queued requests reject on refresh failure (was hanging `isLoading` forever)
- [x] **Stable queryKeys:** `computeRange` / `filters` wrapped in `useMemo` (was causing 1000+/sec request flood)
- [x] **Analytics query gates:** `retry: false` + `enabled: !!accessToken`
- [x] **Light mode default:** class applied in `main.tsx` pre-mount, migrated localStorage `theme → theme_v2`
- [x] **Code splitting:** all non-Login pages via `React.lazy()` — main bundle 776 KB → 220 KB (70 KB gzip), Analytics chunked separately (recharts 108 KB gzip lazy)
- [x] **Mobile polish:** viewport-fit=cover, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `overflow-x: hidden`, safe-area insets, `font-size: 16px` on inputs (prevents iOS zoom), `prefers-reduced-motion`
- [x] **Responsive Analytics:** chart height `240/320` via matchMedia, stat card scaled, padding responsive
- [x] **KanbanBoard period filter parity:** dashboards now use `7 Days / 30 Days / All Time / Custom` matching Analytics

### Infrastructure
- [x] Git repo: `https://github.com/mktg-canvas/Canvas_Ticketing_site.git`
- [x] Commits from `AryanTN05` / `aryansree2003@gmail.com`
- [x] `.githooks/post-commit` auto-appends commit entries to this file

---

## ❌ PENDING

### Nice-to-have
- [ ] **Bundle size warning:** Analytics chunk is 371 KB (recharts). Consider `recharts/es6` tree-shaking or alt lib.
- [ ] **Rate limiter storage:** currently in-memory — resets on restart. Move to Redis for multi-instance prod.
- [ ] **Request logging:** no morgan/pino in backend. Only boot log. Useful for prod.
- [ ] **`avatar_url` field:** user model lacks avatar — ProfileMenu uses initials only.
- [ ] **Email/notification system:** none currently. If SendGrid added, re-add the old dark email templates (removed in facility-management refactor).
- [ ] **Forgot-password UI:** no frontend page. Backend OTP flow was removed during refactor.
- [ ] **Attachments:** not supported in current schema (removed during refactor).
- [ ] **SLA / priority / ratings:** removed in simplification. Re-add if business requires.

### Known backlog from user conversations
- [ ] Delete ticket UI in AllTickets (dead `onDelete` prop was removed 2026-04-22 — re-wire if needed)
- [ ] Production Express CORS origin hardening (currently `process.env.CLIENT_URL || localhost:5173`)

---

## Seed Data (current)
Super admins:
- `aryan@canvaswork.co` / `Canvas@502` — real user (never curl-login as them; invalidates their browser session)
- `admin@canvaswork.co` / `Canvas@502` — test admin for debugging

FMs:
- `mitali@canvaswork.co` · `jugnu@canvaswork.co` · `vignesh@canvaswork.co` — all `Canvas@502`

Seed script: `backend/src/seed.ts <email> <password> <name>` — creates or updates a super_admin.

---

## Known Issues / Gotchas

### Dev environment
- **macOS port 5000** conflicts with AirPlay Receiver. Backend runs on **3001**.
- **Vite 8 (rolldown)** requires `import type { X }` for TypeScript types — bare `import { X }` of types causes white screen in some edge cases.
- **Prisma v7 Driver Adapter:** cannot instantiate `new PrismaClient()` in ad-hoc scripts without the adapter wiring. Use the raw `pg` Pool for one-off scripts.
- **Supabase pooler password** contains `@` — must be URL-encoded as `%40` in connection strings.

### Runtime / logic pitfalls (DO NOT REGRESS)
- **Axios refresh-token queue:** on refresh failure, the queue MUST reject (not just leave pending). See `frontend/src/lib/axios.ts`. Symptoms if broken: `isLoading` stuck true forever, no error banner.
- **React Query filter memoization:** never put `new Date()` or other per-render non-pure values into a queryKey. Always `useMemo` the filter object. Symptoms if broken: infinite request flood, 429 from rate limiter, UI stuck loading.
- **Recharts colors:** use hardcoded hex (`#ef4444`, `#f59e0b`, `#10b981`, etc.), NOT `var(--color-*)` — CSS custom properties in SVG `fill` attrs render inconsistently blank.
- **Prisma raw SQL separator:** `Prisma.join(conds, ' AND ')` — second arg is a plain string, not a `Prisma.sql` fragment. Using the fragment errors: `Argument of type 'Sql' is not assignable to parameter of type 'string'`.
- **`loginUser` rotates refresh tokens** — every login writes a new `refresh:{userId}` in Redis, invalidating prior sessions. Don't curl-login as the real user during debugging.
- **Theme class on `<html>`:** applied in `main.tsx` BEFORE React mounts. Do not move back into Zustand initializer — `themeStore` only loads after login so Login page would mismatch.
- **Loading skeletons in light theme:** use `bg-color-bg3` (gray-200) — `bg-color-bg2` (gray-50) is nearly invisible on the page background.

### Database / data
- **Tickets `updated_at` is NOT NULL** — must supply when inserting via raw SQL (`INSERT ... updated_at`).
- **Tickets lack a `title` column** — uses `description` + `sub_category`. Old scripts referencing `title` will fail.

---

## Build Output (post-optimization, Apr 2026)

```
dist/index.html                        0.74 kB (0.39 gzip)
dist/assets/index-*.css               24.08 kB (5.56 gzip)
dist/assets/index-*.js               220.04 kB (70.78 gzip)   ← main
dist/assets/axios-*.js               109.52 kB (38.86 gzip)
dist/assets/Analytics-*.js           371.48 kB (108.39 gzip)  ← lazy
+ per-page chunks: Dashboard/AllTickets/RaiseTicket/TicketDetail/Accounts — 1–15 kB each
```

FM users never load the 108 KB Analytics chunk (recharts).

---

## Commit History

<!-- Auto-appended by .githooks/post-commit — do not edit below this line manually -->
