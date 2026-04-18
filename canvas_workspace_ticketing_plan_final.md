# Canvas Workspace — Ticket Management System
## Complete Project Plan & Technical Specification

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design Philosophy](#2-design-philosophy)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Database Schema](#5-database-schema)
6. [Authentication System](#6-authentication-system)
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 [Client Portal](#71-client-portal)
   - 7.2 [Admin Panel](#72-admin-panel)
   - 7.3 [Super Admin Dashboard](#73-super-admin-dashboard)
8. [Ticket Lifecycle & Stages](#8-ticket-lifecycle--stages)
9. [Email Notification System](#9-email-notification-system)
10. [Analytics & Reporting Dashboard](#10-analytics--reporting-dashboard)
11. [Rating & Feedback System](#11-rating--feedback-system)
12. [Tech Stack](#12-tech-stack)
13. [Folder Structure](#13-folder-structure)
14. [API Endpoints](#14-api-endpoints)
15. [UI Design System](#15-ui-design-system)
16. [Development Phases & Timeline](#16-development-phases--timeline)
17. [Security Considerations](#17-security-considerations)

---

## 1. Project Overview

**Product Name:** Canvas Workspace — Client Ticket Management System
**Purpose:** A web-based platform for managing complaints and service requests raised by clients renting fully furnished and managed office spaces. Enables end-to-end ticket resolution with full audit trails, automated email notifications, data analytics, and post-resolution feedback.

### Core Goals

- Allow clients to raise, track, and close support tickets from a web portal
- Give admins a structured, fast workflow to manage and resolve facility issues
- Give super admins a bird's-eye view of all accounts, offices, and performance
- Record a complete timestamp for every action taken on every ticket
- Provide meaningful analytics: which company raises the most, how fast issues are resolved, satisfaction scores
- Collect star ratings and feedback from clients after each resolution

### What We Are Not Building

- No mobile app — one responsive website works on all devices
- No AI or chatbot features in V1
- No multichannel support (WhatsApp, social media) — web portal form only
- No knowledge base or help articles — office issues need a human fix

---

## 2. Design Philosophy

### Inspired By: Zoho Desk (Adapted for Facility Management)

Zoho Desk is the industry reference for this type of product. We adopt its proven patterns and skip its bloat.

**What we copy from Zoho Desk:**
- 3-pane layout on desktop: ticket list (left) + thread (middle) + info/actions panel (right)
- SLA countdown timers visible on every ticket row
- Chronological ticket activity timeline combining comments and status changes
- Visually distinct internal notes — visible to admin only, never to client
- Per-admin performance scorecard in analytics
- "Needs attention" strip for unacknowledged tickets

**What we skip:**
- Multichannel inbox (email, chat, WhatsApp, social) — not needed
- Knowledge base and self-service portal — not relevant for facility issues
- AI field prediction and workflow automation builder — V2 consideration
- Parent-child ticket linking — V2 consideration

**Zoho's biggest mistake we avoid:**
Zoho Desk is consistently rated as overwhelming by new users — too many icons, menus, and panels on one screen. Our rule: every screen has one primary action. On the ticket detail page that action is "Update Status". Everything else is secondary.

### Dark Theme

The entire interface uses a dark theme. It is easier on the eyes during long work sessions, looks professional, and reduces eye strain for admins reviewing tickets throughout the day.

```
Background layers (darkest to lightest):
  --bg0: #0f1117   ← page background
  --bg1: #181c24   ← sidebar, top nav, panels
  --bg2: #1f2330   ← cards, message bubbles
  --bg3: #262c3a   ← inputs, hover states
  --bg4: #2e3545   ← badges, secondary surfaces

Text:
  --txt1: #e8eaf0  ← primary text
  --txt2: #8b92a5  ← secondary text
  --txt3: #565e72  ← muted labels, timestamps

Semantic colours:
  --accent: #4f8ef7   ← blue — primary actions, links, active nav
  --green:  #2ecc8a   ← resolved, success, on time
  --amber:  #f5a623   ← in progress, warning, near SLA
  --red:    #f05252   ← open, critical, SLA breach, errors
```

### Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| Mobile (< 768px) | Single column, bottom action bar, card list |
| Tablet (768–1024px) | 2-column, sidebar icon-only |
| Desktop (> 1024px) | Full 3-pane Zoho-style layout |

### Touch Rules for Admin on Phone Browser

- All tappable elements: minimum 48×48px
- Font size on inputs: minimum 16px (prevents iOS browser auto-zoom)
- Status updates on mobile: bottom sheet drawer, not a dropdown
- No hover-only interactions — everything works with a tap
- Colour is never the only indicator — always paired with a label

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              React.js (Vite) + Tailwind CSS                  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Client Portal  │  │ Admin Panel  │  │ Super Admin    │  │
│  │  (responsive)   │  │ (mobile-1st) │  │ (desktop)      │  │
│  └─────────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS / REST API
┌──────────────────────────▼───────────────────────────────────┐
│                   Node.js + Express.js                       │
│  Auth Service │ Ticket Service │ Email Service │ Analytics   │
└──────┬──────────────────────────────┬────────────────────────┘
       │                              │
┌──────▼──────────────┐   ┌───────────▼─────────┐
│  PostgreSQL DB       │   │  Redis (Sessions)    │
└──────────────────────┘   └─────────────────────┘
       │
┌──────▼──────────────┐   ┌─────────────────────┐
│  Cloudinary          │   │  SendGrid (Email)    │
│  (File Storage)      │   └─────────────────────┘
└──────────────────────┘
```

---

## 4. User Roles & Permissions

### Role Hierarchy

```
Super Admin  (global — all offices)
    └── Admin  (per office location)
            └── Client  (company tenant — multiple users per company)
```

### Single Login Page

One login page at `/login` for everyone. No role selection — the user enters their email and password, the backend reads their role from the database, and redirects them automatically.

```
/login  →  email + password  →  backend checks role in DB
                               ↓
               client      →  /client/dashboard
               admin       →  /admin/dashboard
               super_admin →  /superadmin/dashboard
```

**How roles are assigned:**

| Role | How it is set |
|------|--------------|
| `client` | Default for every new sign-up — no manual action needed |
| `admin` | Set directly in the DB by the owner — cannot be self-assigned |
| `super_admin` | Set directly in the DB by the owner — cannot be self-assigned |

There is no role selection in the UI. A user cannot request or escalate their own role. Role changes are only possible via a direct DB update by the owner.

### Permission Matrix

| Feature | Client | Admin | Super Admin |
|---------|--------|-------|-------------|
| Raise a ticket | ✅ | ❌ | ❌ |
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets (own office) | ❌ | ✅ | ✅ |
| View all tickets (all offices) | ❌ | ❌ | ✅ |
| Update ticket status | ❌ | ✅ | ✅ |
| Add public comment | ✅ | ✅ | ✅ |
| Add internal note | ❌ | ✅ | ✅ |
| Assign ticket to admin | ❌ | ✅ | ✅ |
| Mark ticket as resolved | ❌ | ✅ | ✅ |
| Submit rating and feedback | ✅ | ❌ | ❌ |
| View analytics (own office) | ❌ | ✅ | ✅ |
| View analytics (all offices) | ❌ | ❌ | ✅ |
| Manage admin accounts | ❌ | ❌ | ✅ |
| Manage companies | ❌ | ✅ | ✅ |
| Manage client accounts | ❌ | ✅ | ✅ |
| Export reports | ❌ | ✅ | ✅ |
| Configure SLA settings | ❌ | ❌ | ✅ |

---

## 5. Database Schema

### `companies`
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
name              VARCHAR(255) NOT NULL
office_location   VARCHAR(255)
assigned_admin_id UUID REFERENCES users(id)
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   TEXT NOT NULL
role            ENUM('client', 'admin', 'super_admin') NOT NULL
company_id      UUID REFERENCES companies(id)   -- clients only, null for admin/super_admin
is_active       BOOLEAN DEFAULT true
last_login      TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### `tickets`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_number   VARCHAR(20) UNIQUE NOT NULL        -- CW-2024-0001
title           VARCHAR(255) NOT NULL
description     TEXT NOT NULL
category        ENUM('electrical','plumbing','internet','housekeeping',
                     'furniture','hvac','security','access','billing','other')
priority        ENUM('low','medium','high','critical') DEFAULT 'medium'
status          ENUM('open','acknowledged','in_progress','on_hold',
                     'resolved','closed') DEFAULT 'open'
raised_by       UUID REFERENCES users(id) NOT NULL
company_id      UUID REFERENCES companies(id) NOT NULL
assigned_to     UUID REFERENCES users(id)
sla_due_at      TIMESTAMPTZ
resolved_at     TIMESTAMPTZ
closed_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### `ticket_activities`  ← complete audit trail
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_id       UUID REFERENCES tickets(id) NOT NULL
actor_id        UUID REFERENCES users(id) NOT NULL
actor_role      ENUM('client','admin','super_admin')
activity_type   ENUM('created','status_changed','assigned','comment_added',
                     'note_added','attachment_added','resolved','closed','rating_submitted')
old_value       TEXT     -- previous status value
new_value       TEXT     -- new status value
comment         TEXT     -- comment or note body text
is_internal     BOOLEAN DEFAULT false   -- true = internal note, hidden from client
created_at      TIMESTAMPTZ DEFAULT now()
```

### `attachments`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_id       UUID REFERENCES tickets(id) NOT NULL
uploaded_by     UUID REFERENCES users(id) NOT NULL
file_name       VARCHAR(255)
file_url        TEXT        -- Cloudinary signed URL
file_size       INTEGER
mime_type       VARCHAR(100)
created_at      TIMESTAMPTZ DEFAULT now()
```

### `ratings`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
ticket_id       UUID REFERENCES tickets(id) UNIQUE NOT NULL
submitted_by    UUID REFERENCES users(id) NOT NULL
rating          INTEGER CHECK (rating BETWEEN 1 AND 5)
feedback        TEXT
submitted_at    TIMESTAMPTZ DEFAULT now()
```

### `notifications`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) NOT NULL
ticket_id       UUID REFERENCES tickets(id)
type            ENUM('ticket_created','status_updated','comment_added',
                     'resolved','rating_requested','sla_warning')
message         TEXT
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## 6. Authentication System

### Single Login Portal

One URL, one form — `/login`. Email + password only. The backend determines the role from the database and the frontend routes the user to their portal. New self-registered accounts always get `role: client`. Admin and super_admin roles are seeded directly in the DB by the owner.

### Token Strategy
- Access token: JWT, 15-minute expiry, stored in memory (not localStorage)
- Refresh token: JWT, 7-day expiry, stored in httpOnly cookie
- Token payload: `{ userId, role, companyId }`
- Redis stores active refresh tokens — enables forced logout from any session

### Password Policy
- Minimum 8 characters with uppercase, number, and special character
- Hashed with bcrypt, salt rounds: 12

### Password Reset
- 6-digit OTP sent to email, expires in 10 minutes
- Reset link is single-use; all active sessions invalidated after reset

### Account Lockout
- 5 failed login attempts → account locked for 15 minutes
- Super admin can manually unlock any account

---

## 7. Feature Specifications

### 7.1 Client Portal

#### Login Page (shared by all roles — `/login`)
- Email and password fields only
- "Sign in" button — on success, backend returns role and frontend redirects to the correct portal
- Forgot password link
- "New here? Create an account" link → sign-up form (registers as client by default)
- Dark card centered on page

#### Dashboard (Home)
- 3 summary KPI cards: Open | In Progress | Resolved
- "Raise a Ticket" button — large, prominent, always visible at top
- 5 most recent tickets listed with status badges
- Each row: Ticket # | Title | Status | Raised date

#### Raise a Ticket
Form fields:
- Title — required, short subject line
- Category — dropdown: HVAC, Electrical, Plumbing, Internet, Housekeeping, Furniture, Security, Access Cards, Billing, Other
- Priority — Low / Medium / High
- Description — textarea, required, minimum 20 characters
- Attachments — image or PDF, max 5 files, 10 MB each

On submit:
- Ticket created with status `open` and auto-generated number `CW-YYYY-XXXX`
- `created_at` timestamp saved
- Confirmation email sent to client
- Admin notified by email

#### My Tickets
- Full list of the client's tickets
- Filters: Status | Category | Date range
- Card view on mobile, table on desktop
- Click any ticket to view full detail and thread

#### Ticket Detail
- Ticket info: title, category, priority, status badge
- Full activity timeline — all comments and status changes chronological with timestamps
- Client can add a reply to the thread
- If status is `resolved` — star rating prompt appears at the top of the page

---

### 7.2 Admin Panel

The admin panel is the most-used part of the system. Designed mobile-first for small phone browsers, scales to full desktop.

#### Top Navigation Bar (all admin pages)
```
[● Canvas Workspace]  [Dashboard]  [Tickets]  [Clients]  [Alerts 🔔 3]  [RV]
```

#### Left Sidebar (desktop) / Collapsible drawer (mobile)
```
Overview
Open tickets          12  ← red badge
In progress            5
On hold                2
Resolved              38
─────────────────────────
My clients
Settings
```

#### Dashboard (Home)
- 4 KPI cards: Open tickets | In progress | Resolved today | CSAT score
- "Needs attention" — tickets unacknowledged for over 2 hours, shown as a flagged list
- Recent tickets table (last 10): Ticket # | Company | Title | Priority | Status | SLA timer | Time ago

#### All Tickets View

Desktop — sortable table:
- Ticket # | Company | Title | Category | Priority | Status | SLA countdown | Assigned to | Raised

Mobile — card list, each card shows:
- Company name (bold) + time ago
- Ticket title (2 lines max)
- Status badge + priority dot + SLA chip

Filters:
- Status chips: All / Open / Acknowledged / In Progress / On Hold / Resolved
- Priority: Critical / High / Medium / Low
- Company dropdown
- Date range picker
- Assigned to dropdown

Sort options: Priority | Status | Oldest first | SLA deadline

#### Ticket Detail Page — 3-Pane Layout (Zoho-style)

**Left pane (240px)** — Scrollable ticket list with the same card design as All Tickets. Clicking a card loads the thread in the middle without a full page reload.

**Middle pane (flexible width)** — Full ticket thread.
- Sticky header: Ticket # | Company | Title | Status badge | Priority | Category | Time raised
- Activity timeline (chronological):
  - Client comments — dark card
  - Admin replies — slightly lighter card
  - Internal notes — amber left border, "Internal — not visible to client" label
  - Status change events — centered divider with description, e.g. "Ravi moved to In Progress · 9:14 AM"
- Reply box at bottom:
  - Textarea: "Write a reply to the client..."
  - Toggle: "Mark as internal note"
  - Attach button + Send reply button (primary blue)

**Right pane (220px)** — Actions and context.
- Status dropdown + "Update status" button (primary, full width)
- "Resolve ticket" secondary button
- Assign to admin dropdown
- Priority selector
- SLA block — time remaining or "Overdue" in red
- Client info: Company | Contact name | Email | Office floor

**Mobile layout (below 768px):**
- Thread is the main view, full width
- Right pane becomes a "Details" tab alongside "Thread" tab at the top
- Fixed bottom action bar: [Update Status ▾] [+ Reply] — split, full width, 52px tall
- Status update opens as a bottom sheet with large radio buttons

#### Client Management
- List of companies assigned to this admin
- Each company: name, active ticket count, number of client users
- Tap to open: client list + full ticket history for that company
- Add and deactivate client accounts

---

### 7.3 Super Admin Dashboard

#### Global Navigation
```
[● Canvas Workspace]  [Dashboard]  [All Tickets]  [Analytics]  [Accounts]  [SA]
```

#### Dashboard (Global Overview)
- KPI cards: Total companies | Total tickets | Open across all offices | Avg resolution time | CSAT
- Admin performance table: Name | Office | Open tickets | Avg resolution time | CSAT
- SLA breached tickets — full list across all offices

#### All Tickets (Global)
- Same as admin ticket view but spans all admins and offices
- Additional filters: Office location | Assigned admin

#### Account Management

Admins tab:
- Table: Name | Email | Office | Open tickets | Last active
- Create: name, email, temp password, assign office
- Edit / deactivate

Companies tab:
- Table: Company name | Location | Admin assigned | Active tickets | Client count
- Create, edit, deactivate

Clients tab:
- Table: Name | Email | Company | Active tickets | Status
- View and deactivate individual client accounts

#### Settings
- SLA configuration per priority level
- Email notification toggle per event
- System-wide settings

---

## 8. Ticket Lifecycle & Stages

### Status Flow

```
Client raises ticket
        │
        ▼
   ┌─────────┐
   │  OPEN   │   ← Created. Admin not yet acknowledged.
   └────┬────┘
        │ Admin acknowledges
        ▼
┌──────────────┐
│ ACKNOWLEDGED │   ← Admin has seen it.
└──────┬───────┘
       │ Admin starts working
       ▼
┌─────────────┐
│ IN PROGRESS │   ← Actively being resolved.
└──────┬──────┘
       │                    │
       │                    ▼
       │            ┌──────────┐
       │            │  ON HOLD │   ← Waiting for vendor / part / info.
       │            └────┬─────┘
       │                 │ Resumed
       │◄────────────────┘
       │ Issue fixed
       ▼
┌──────────────┐
│   RESOLVED   │   ← Admin marks resolved. Client gets email + rating link.
└──────┬───────┘
       │ Client rates OR 7 days pass
       ▼
┌──────────┐
│  CLOSED  │   ← Final state. Immutable. No further changes.
└──────────┘
```

### What Every Status Change Records

Stored in `ticket_activities`:
- New status and previous status
- Who changed it (user ID + role)
- Exact timestamp
- Optional comment added alongside the change

### SLA Targets (configurable by super admin)

| Priority | Acknowledge within | Resolve within |
|----------|-------------------|----------------|
| Critical | 1 hour | 4 hours |
| High | 2 hours | 8 hours |
| Medium | 4 hours | 24 hours |
| Low | 8 hours | 72 hours |

**SLA chip states:**
- Green — more than 50% of SLA time remaining
- Amber — less than 50% remaining
- Red "Overdue" — SLA breached

---

## 9. Email Notification System

### Provider
- Production: SendGrid
- Development: Nodemailer + Mailtrap

### Trigger to Recipient Map

| Trigger | Client | Admin | Super Admin |
|---------|--------|-------|-------------|
| Ticket raised | Confirmation | New ticket alert | — |
| Ticket acknowledged | Status update | — | — |
| Status changed | Status update | — | — |
| Admin adds public comment | Notification | — | — |
| Client adds comment | — | Notification | — |
| Ticket resolved | Resolution + rating link | — | — |
| SLA 50% warning | — | Warning | — |
| SLA breached | — | Breach alert | CC on breach |
| Rating submitted | — | Feedback notification | — |

### Key Email Templates

#### Ticket Raised — Client Confirmation
```
Subject: [CW-2024-0001] Ticket received — {Ticket Title}

Dear {Client Name},

Your support ticket has been received.

Ticket number : CW-2024-0001
Title         : {Ticket Title}
Category      : {Category}
Priority      : {Priority}
Raised on     : {Date & Time}

Our team will acknowledge your request within {SLA hours}.
Track your ticket: {Portal link}

Canvas Workspace Support
```

#### Ticket Resolved — Client + Rating Request
```
Subject: [CW-2024-0001] Resolved — Please rate your experience

Dear {Client Name},

Your issue has been resolved.

Ticket number   : CW-2024-0001
Resolved on     : {Date & Time}
Resolution time : {X hours Y minutes}

Please rate your experience:
{Rating link — 1 to 5 stars}

This link expires in 7 days.

Canvas Workspace Support
```

#### New Ticket Alert — Admin
```
Subject: New ticket [CW-2024-0001] — {Company Name} — {Priority}

Ticket    : CW-2024-0001
Company   : {Company Name}
Title     : {Title}
Priority  : {Priority}
Raised at : {Timestamp}

Open in admin panel: {Link}
```

---

## 10. Analytics & Reporting Dashboard

> Available to admin (own office) and super admin (all offices).
> On admin mobile browser: only KPI numbers are shown. Charts are hidden via CSS media query — no heavy chart data is loaded over 3G.

### KPI Strip

| Metric | Description |
|--------|-------------|
| Total tickets | All time or filtered period |
| Open now | Current unresolved count |
| Avg resolution time | For the selected period |
| CSAT score | Average star rating |
| SLA compliance % | Resolved within SLA / total resolved |
| First response time | Avg time from open to acknowledged |

### Charts and Visualisations

**Tickets by company (horizontal bar chart)**
Each company on Y-axis, ticket count as bar width. Click a company to filter all other charts.

**Tickets by category (legend with percentage bars)**
HVAC, Electrical, Plumbing, Internet, etc. Clean legend list with percentage fill bars.

**SLA compliance by priority (progress bars)**
One bar per priority level — percentage resolved within SLA.

**Resolution time by company (card grid)**
Each company gets a card: name, ticket count, average hours, colour-coded bar (green = fast, red = slow).

**Rating distribution (horizontal bar chart)**
1 to 5 stars, each as a bar showing percentage of total ratings.

**Admin performance table (super admin only)**
Name | Office | Tickets handled | Avg resolution time | CSAT score

### Filters

All charts respond together to:
- Date range: Today / This week / This month / Custom
- Company: All or specific
- Admin: All or specific (super admin only)
- Category: All or specific
- Priority: All or specific

### Export
- Filtered data as CSV or Excel (.xlsx)
- Full analytics page as PDF report
- Scheduled email reports (weekly / monthly) — configurable by super admin

---

## 11. Rating & Feedback System

### Flow

1. Admin sets ticket to `resolved`
2. Client receives email with a unique rating link (valid 7 days, single-use)
3. Client clicks link — rating form opens on the client portal
4. Client selects 1–5 stars and optional text feedback
5. On submit:
   - `rating_submitted` logged in ticket_activities with timestamp
   - Admin notified by email
   - Ticket status moves to `closed` automatically
6. If no rating submitted within 7 days — ticket auto-closes with null rating

### Rating Form UI

```
How satisfied are you with the resolution?

  ★ ★ ★ ★ ★   (tap — 1 = Very poor, 5 = Excellent)

Additional comments (optional):
[ _____________________________________________ ]

[ Submit feedback ]
```

### Rules

- One rating per ticket — cannot be re-submitted or edited after submission
- Rating token is single-use with 7-day expiry
- Rating visible to admin and super admin on ticket detail and analytics
- Unrated closed tickets tracked separately in analytics (not conflated with 0-star ratings)

---

## 12. Tech Stack

### Frontend

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | React.js (Vite) | ~90KB bundle, fast builds, large ecosystem |
| Styling | Tailwind CSS | Zero unused CSS in prod, mobile-first trivial |
| Admin components | Plain Tailwind only (no shadcn) | Keeps admin JS bundle small — critical for 3G |
| Super admin components | Tailwind + shadcn/ui | Desktop, bandwidth not a concern |
| State | Zustand | 1.5KB, no boilerplate |
| Server state | TanStack Query | Auto-caching, background refetch — admin won't re-fetch on every tap |
| HTTP | Axios with retry interceptor | Handles flaky 3G connections gracefully |
| Forms | React Hook Form | Zero re-renders, minimal JS overhead |
| Charts | Recharts (super admin desktop only) | Hidden on mobile via CSS |
| Icons | Lucide React | Tree-shakeable — only used icons are included |

### Backend

| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js v20+ | |
| Framework | Express.js | Lighter than NestJS, faster cold start |
| ORM | Prisma | Type-safe, excellent migrations |
| Auth | JWT + bcrypt | 15-min access token + httpOnly refresh cookie |
| Email | Nodemailer + SendGrid | |
| File uploads | Multer + Cloudinary | Cloudinary auto-compresses images from phone cameras |
| Cache / sessions | Redis (ioredis) | Refresh token store, forced logout |
| API docs | Swagger (OpenAPI) | |

### Infrastructure

| Component | Service |
|-----------|---------|
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ |
| File storage | Cloudinary |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Email delivery | SendGrid |
| CI/CD | GitHub Actions |

### Performance Budget — Admin Panel on 3G

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 2.5s |
| Time to Interactive | < 4s |
| JS bundle gzipped | < 150KB |
| CSS gzipped | < 20KB |
| Lighthouse mobile score | > 85 |
| Images | WebP format, max 200KB each |

---

## 13. Folder Structure

```
canvas-ticketing/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.tsx
│   │   │   ├── client/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── RaiseTicket.tsx
│   │   │   │   ├── MyTickets.tsx
│   │   │   │   └── TicketDetail.tsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── AllTickets.tsx
│   │   │   │   ├── TicketDetail.tsx    ← 3-pane layout
│   │   │   │   └── Clients.tsx
│   │   │   └── superadmin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Analytics.tsx
│   │   │       ├── AllTickets.tsx
│   │   │       └── Accounts.tsx
│   │   ├── components/
│   │   │   ├── tickets/
│   │   │   │   ├── TicketCard.tsx      ← mobile card
│   │   │   │   ├── TicketTable.tsx     ← desktop table
│   │   │   │   ├── TicketThread.tsx    ← activity timeline
│   │   │   │   ├── StatusSheet.tsx     ← mobile bottom sheet
│   │   │   │   └── SLAChip.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── BarChart.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   └── layout/
│   │   │       ├── TopNav.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── MobileNav.tsx
│   │   ├── hooks/
│   │   │   ├── useTickets.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useAnalytics.ts
│   │   ├── store/
│   │   │   └── authStore.ts            ← Zustand
│   │   ├── lib/
│   │   │   ├── axios.ts                ← instance with retry
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── tickets.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── companies.routes.ts
│   │   │   ├── ratings.routes.ts
│   │   │   └── analytics.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── upload.ts
│   │   └── email/
│   │       ├── emailService.ts
│   │       └── templates/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── tests/
│
└── docs/
    ├── API.md
    └── DEPLOYMENT.md
```

---

## 14. API Endpoints

### Authentication
```
POST   /api/auth/login               → Login (role passed in body)
POST   /api/auth/logout              → Invalidate refresh token
POST   /api/auth/refresh             → New access token via refresh cookie
POST   /api/auth/forgot-password     → Send OTP to email
POST   /api/auth/reset-password      → Reset with OTP
```

### Tickets
```
POST   /api/tickets                        → Raise ticket (client)
GET    /api/tickets                        → List tickets (auto-filtered by role)
GET    /api/tickets/:id                    → Full ticket detail
PATCH  /api/tickets/:id/status             → Update status (admin+)
PATCH  /api/tickets/:id/assign             → Assign to admin
POST   /api/tickets/:id/comments           → Add comment or internal note
POST   /api/tickets/:id/attachments        → Upload attachment
```

### Ratings
```
POST   /api/ratings/:ticketId              → Submit rating (client, once)
GET    /api/ratings/:ticketId              → Get rating
```

### Users & Companies
```
GET    /api/users                          → List users (admin+)
POST   /api/users                          → Create user
PATCH  /api/users/:id                      → Update user
PATCH  /api/users/:id/deactivate           → Deactivate (no hard deletes)
GET    /api/companies                      → List companies
POST   /api/companies                      → Create company (super admin)
PATCH  /api/companies/:id                  → Update company
```

### Analytics
```
GET    /api/analytics/overview             → KPI summary
GET    /api/analytics/tickets-by-company   → Per-company ticket counts
GET    /api/analytics/resolution-time      → Avg resolution time stats
GET    /api/analytics/sla-performance      → SLA compliance breakdown
GET    /api/analytics/ratings              → CSAT and rating distribution
GET    /api/analytics/admin-performance    → Per-admin stats (super admin)
GET    /api/analytics/export               → CSV or Excel download
```

---

## 15. UI Design System

### Color Tokens
```css
--bg0: #0f1117    /* page background */
--bg1: #181c24    /* top nav, sidebar, panels */
--bg2: #1f2330    /* cards, message bubbles */
--bg3: #262c3a    /* inputs, active hover */
--bg4: #2e3545    /* badges, secondary borders */

--txt1: #e8eaf0   /* primary text */
--txt2: #8b92a5   /* secondary text */
--txt3: #565e72   /* muted labels and timestamps */

--accent: #4f8ef7  /* blue — primary CTA, links, active state */
--green:  #2ecc8a  /* resolved, on-time SLA, success */
--amber:  #f5a623  /* in progress, near-SLA, warning */
--red:    #f05252  /* open, critical, overdue, error */
```

### Status Badge Colours

| Status | Background | Text colour |
|--------|-----------|-------------|
| Open | red at 15% opacity | --red |
| Acknowledged | accent at 15% opacity | --accent |
| In Progress | amber at 15% opacity | --amber |
| On Hold | --bg4 | --txt2 |
| Resolved | green at 15% opacity | --green |
| Closed | --bg4 | --txt3 |
| SLA Breached | red at 25% opacity | bright #ff4444 |

### Typography
- Font: System UI stack — no custom font load (faster on 3G)
- Body: 14px / line-height 1.6 / color: --txt1
- Labels: 12px / color: --txt3
- Inputs: 16px minimum (prevents iOS auto-zoom)
- Page titles: 16px / font-weight 500

### Key Component Patterns

**Ticket card (mobile list)**
```
┌─────────────────────────────────────┐
│  TechCorp India          2h ago     │
│  AC not working in cabin 3          │
│  [Open]  ● High  ⏱ 1h 20m          │
└─────────────────────────────────────┘
```

**SLA chip**
```
[ 6h 40m ]  ← green  (> 50% time left)
[ 1h 20m ]  ← amber  (< 50% remaining)
[ Overdue ] ← red    (SLA breached)
```

**Internal note (thread view)**
```
amber left border │  Internal — not visible to client  ← amber 11px label
                  │  Ravi · 9:18 AM
                  │  Called vendor Cooltech, technician en route...
```

**Buttons**
- Primary: `background: --accent` | white text | 6px radius | min height 40px
- Ghost: `background: --bg3` | --txt2 text | 1px border --bg4
- Destructive: amber-tinted background | --red text

---

## 16. Development Phases & Timeline

### Phase 1 — Foundation (Week 1–2)
- [ ] Monorepo setup, GitHub Actions CI/CD
- [ ] PostgreSQL schema and Prisma migrations
- [ ] Auth: JWT, three login portals, refresh rotation, password reset OTP
- [ ] User and company CRUD APIs
- [ ] Dark theme base: CSS tokens, typography, base components

### Phase 2 — Core Ticket System (Week 3–4)
- [ ] Raise ticket form (client portal)
- [ ] Ticket listing with status filter chips
- [ ] Status update with full audit log in ticket_activities
- [ ] File upload via Cloudinary (Multer)
- [ ] Auto-generate ticket number (CW-YYYY-XXXX)
- [ ] SLA deadline calculation on ticket creation

### Phase 3 — Ticket Detail and Thread (Week 5)
- [ ] 3-pane layout (desktop)
- [ ] Single-column stacked layout (mobile)
- [ ] Activity timeline (comments + status changes in one thread)
- [ ] Internal notes with amber left-border visual distinction
- [ ] Reply box with internal note toggle
- [ ] Mobile bottom sheet for status updates
- [ ] SLA chip component with colour state logic

### Phase 4 — Email Notifications (Week 6)
- [ ] SendGrid integration and transactional templates
- [ ] All trigger events wired up
- [ ] In-app notification bell with unread badge
- [ ] Notification records stored in DB

### Phase 5 — Admin Panel Polish (Week 7)
- [ ] Dashboard KPI cards and needs-attention section
- [ ] Ticket table with all filters and sort options
- [ ] Client management screens
- [ ] SLA breach alerts and visual indicators
- [ ] Assign ticket to admin flow

### Phase 6 — Rating and Feedback (Week 8)
- [ ] Rating token generation (single-use, 7-day expiry)
- [ ] Star rating UI component
- [ ] Rating submission API
- [ ] Auto-close after rating or 7-day timeout
- [ ] Rating display on ticket detail (admin view)

### Phase 7 — Analytics Dashboard (Week 9)
- [ ] All analytics API endpoints with filter params
- [ ] KPI strip component
- [ ] Bar chart: tickets by company
- [ ] Progress bars: SLA compliance by priority
- [ ] Resolution time card grid
- [ ] Rating distribution chart
- [ ] CSV and Excel export
- [ ] Charts hidden on mobile (CSS media query), KPI numbers only

### Phase 8 — Super Admin (Week 10)
- [ ] Global dashboard across all offices
- [ ] Account management: admins, companies, clients
- [ ] Admin performance table
- [ ] SLA configuration settings
- [ ] Global ticket view with cross-office filters

### Phase 9 — QA, Polish, and Launch (Week 11–12)
- [ ] End-to-end tests with Playwright
- [ ] Manual testing on real Android phone browsers
- [ ] Lighthouse mobile audit — target score > 85
- [ ] OWASP security checklist
- [ ] Production environment setup (Vercel + Railway)
- [ ] Error logging and uptime monitoring
- [ ] User acceptance testing with real admin and client accounts

---

## 17. Security Considerations

### Authentication and Authorisation
- Role-based access control enforced on every API route via middleware
- JWT access tokens short-lived (15 minutes)
- Refresh tokens in httpOnly cookies — inaccessible to JavaScript
- Account lockout: 5 failed attempts → 15-minute lock
- Separate login routes per role reduce attack surface

### Data Security
- Passwords hashed with bcrypt, salt rounds 12
- All inputs validated server-side with Zod
- SQL injection prevented by Prisma parameterised queries
- XSS prevented by React's built-in escaping and DOMPurify on any rich text
- Rate limiting: 100 req/min general, 10 req/min on auth endpoints
- CORS restricted to allowed origins only

### File Uploads
- MIME type check and extension whitelist server-side
- Max 10 MB per file enforced server-side
- Files stored in Cloudinary, not on the application server
- Time-limited signed URLs for file access — no permanent public links

### Audit and Compliance
- All ticket state changes permanently logged in ticket_activities with actor and timestamp
- No hard deletes on tickets, activities, or users — soft delete only (`is_active = false`)
- Rating tokens are single-use and expire after 7 days
- Admin actions on client accounts are logged

### Infrastructure
- HTTPS enforced everywhere (TLS 1.2+)
- All secrets in Railway and Vercel env vars — never in the repository
- PostgreSQL daily backups, retained 30 days
- Redis TTL on all session keys

---

*Document Version: 2.0*
*Last updated: April 2026*
*Summary: Complete spec including dark UI design system, Zoho Desk-inspired 3-pane layout, mobile-responsive website (no separate app), full analytics dashboard, and Zoho feature mapping.*
