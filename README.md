# Canvas — Facility Management Ticketing Platform

Canvas is a role-based ticketing system for property and facility teams. Facility managers (CEMs) raise and track maintenance issues across buildings; admins get full oversight with analytics, reporting, and user management.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [Roles & Permissions](#roles--permissions)
- [Integrations](#integrations)

---

## Features

- **Ticket lifecycle management** — open → in_progress → closed with per-stage notes and audit trail
- **File attachments** — up to 5 files per ticket, stored in Supabase Storage
- **Role-based access** — CEMs see only their own tickets; admins see everything
- **Analytics dashboard** — breakdowns by building, client, CEM, category; line charts; PDF export
- **Kanban view** — drag-and-drop style status columns for ticket management
- **Telegram reports** — automated daily and weekly summaries sent to a group via bot
- **Admin controls** — user, client, building, floor, and category management with soft-delete
- **Caching** — analytics results cached 2 minutes in Redis to reduce database load

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router v7, React Query v5, Zustand, Recharts |
| Backend | Node.js 22+, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL via Supabase (pgbouncer connection pooling) |
| File Storage | Supabase Storage |
| Cache | Upstash Redis (REST API) |
| Auth | JWT (15-min access tokens + 30-day httpOnly refresh tokens) |
| Email | Nodemailer + SendGrid |
| Notifications | Telegram Bot API |
| Deployment | GCP Cloud Run (backend), Vercel (frontend), Cloud Build (CI/CD), Cloud Scheduler (cron) |
| Containerization | Docker (node:24-alpine) |

---

## Project Structure

```
Canvas_Ticketing_site/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers + Zod validation
│   │   ├── services/        # Business logic (tickets, analytics, telegram, auth)
│   │   ├── routes/          # Express routers
│   │   ├── middleware/       # Auth, rate limiting, file upload
│   │   ├── lib/             # Prisma, JWT, Redis, Supabase, RLS context
│   │   └── index.ts         # App entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Migration history
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/        # Login page
│   │   │   ├── cem/         # CEM dashboard, ticket list, raise ticket, detail
│   │   │   └── admin/       # Admin dashboard, all tickets, analytics, accounts
│   │   ├── components/
│   │   │   ├── shared/      # Nav, Kanban, search, PDF export, protected routes
│   │   │   └── tickets/     # Ticket form components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand auth store
│   │   └── lib/             # Axios instance, date helpers
│   └── vite.config.ts
│
└── GCP_DEPLOYMENT.md        # Step-by-step GCP setup guide
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- A [Supabase](https://supabase.com) project (database + storage)
- An [Upstash](https://upstash.com) Redis instance
- A Telegram bot token + chat ID (for reports)

### Backend Setup

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev

# (Optional) Seed sample clients, buildings, and floors
npm run db:seed-locations

# Start development server (port 5000 by default)
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Set the backend API URL
echo "VITE_API_URL=http://localhost:5000" > .env.local

# Start development server (port 5173)
npm run dev
```

### Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. From the Supabase dashboard, copy:
   - **Transaction pooler URL** → `DATABASE_URL`
   - **Direct URL** → `DIRECT_URL`
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
3. Create a storage bucket and set the name in `SUPABASE_STORAGE_BUCKET`
4. Run `npx prisma db push` to apply the schema

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (Cloud Run sets this automatically to `8080`) |
| `DATABASE_URL` | Postgres connection string (pgbouncer pooler) |
| `DIRECT_URL` | Postgres direct connection (for Prisma migrations) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name for attachments |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `CLIENT_URL` | Frontend URL (used for CORS) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Target Telegram chat/group ID |
| `CRON_SECRET` | Shared secret for Cloud Scheduler requests (`x-cron-secret` header) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / API key |
| `EMAIL_FROM` | Sender email address |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

---

## Deployment

### Backend — GCP Cloud Run

The backend is containerized and deployed to GCP Cloud Run in the `asia-south1` (Mumbai) region.

1. Push to `main` — Cloud Build picks up the Dockerfile from `backend/` and pushes the image to Artifact Registry
2. Cloud Run pulls and deploys the new image automatically
3. Environment variables are configured in the Cloud Run service console

See [`GCP_DEPLOYMENT.md`](./GCP_DEPLOYMENT.md) for the full step-by-step setup.

### Frontend — Vercel

The frontend deploys automatically from `main` via Vercel.

Set `VITE_API_URL` in the Vercel project environment settings to point to the Cloud Run backend URL.

### Cron Jobs — Cloud Scheduler

Telegram reports are triggered by Cloud Scheduler making authenticated HTTP POST requests to the backend:

| Job | Schedule (IST) | Endpoint |
|---|---|---|
| Daily report | 9 AM daily | `POST /api/telegram/cron/daily` |
| Weekly report | 9 AM every Tuesday | `POST /api/telegram/cron/monthly` |

Each request must include the `x-cron-secret` header matching the `CRON_SECRET` env var.

---

## API Overview

All routes are prefixed with `/api`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password` |
| Tickets | `GET/POST /tickets`, `GET/PATCH/DELETE /tickets/:id` |
| Ticket actions | `PATCH /tickets/:id/status`, `POST /tickets/:id/comments`, `PATCH /tickets/:id/stage-note` |
| Attachments | `POST/DELETE /tickets/:id/attachments`, `DELETE /tickets/:id/attachments/:attachmentId` |
| Analytics | `GET /analytics` (admin only, cached 2 min) |
| Users | `GET/POST /users`, `PATCH /users/:id`, `PATCH /users/:id/deactivate` |
| Clients | `GET/POST /clients`, `PATCH /clients/:id`, `PATCH /clients/:id/deactivate` |
| Buildings | `GET/POST /buildings`, `PATCH /buildings/:id`, `PATCH /buildings/:id/deactivate` |
| Floors | `GET/POST /floors`, `PATCH /floors/:id`, `PATCH /floors/:id/deactivate` |
| Categories | `GET/POST /categories`, `PATCH /categories/:id`, `PATCH /categories/:id/deactivate` |
| Telegram cron | `POST /telegram/cron/:type` (daily \| monthly) |

---

## Roles & Permissions

| Action | CEM | Super Admin |
|---|---|---|
| View own tickets | Yes | Yes |
| View all tickets | No | Yes |
| Raise a ticket | Yes | Yes |
| Change ticket status | No | Yes |
| Add comments | Yes | Yes |
| Manage users/clients/buildings | No | Yes |
| View analytics | No | Yes |
| Trigger reports | No | Yes (via cron) |

Row-level security is enforced server-side using PostgreSQL `set_config` via AsyncLocalStorage, so CEMs can never query another user's tickets regardless of the client request.

---

## Integrations

**Supabase** — PostgreSQL database with pgbouncer connection pooling and managed object storage for ticket attachments.

**Upstash Redis** — Analytics query results are cached for 2 minutes per user + filter combination, keyed as `analytics:{userId}:{role}:{filterHash}`.

**Telegram Bot** — Daily and weekly reports are pushed to a configured group chat. Each report includes ticket counts by status, per-CEM breakdowns, and priority counts. Messages are rate-limited (500 ms delay) to stay within Telegram's API limits.

**SendGrid / SMTP** — Used for forgot-password and reset-password email flows.

**GCP** — Cloud Run hosts the backend container; Cloud Build handles CI/CD on push; Cloud Scheduler replaces in-process cron jobs (which don't fire on scale-to-zero instances); Artifact Registry stores Docker images.
