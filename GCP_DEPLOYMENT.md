# GCP Deployment Guide — Canvas Backend

> Railway stays live until GCP is fully tested and frontend is switched over.

---

## Architecture

| Layer | Service |
|---|---|
| Backend (API) | GCP Cloud Run |
| Database | Supabase PostgreSQL |
| File Storage | Supabase Storage |
| Cache | Upstash Redis |
| Frontend | Vercel (unchanged) |

---

## Phase 1 — GCP Project Setup

### 1. Create a project
- GCP Console → **New Project**
- Name: `canvas-backend`
- Note the **Project ID** — used throughout

### 2. Link billing
- Activate the $300 free trial (add card) **or** link nabin's billing account
- Billing → Link a billing account → select nabin's

### 3. Enable required APIs
Open **Cloud Shell** (terminal icon in top-right of GCP console):

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

---

## Phase 2 — Artifact Registry

Still in Cloud Shell:

```bash
gcloud artifacts repositories create canvas-repo \
  --repository-format=docker \
  --location=asia-south1 \
  --description="Canvas backend images"
```

---

## Phase 3 — Connect GitHub and Deploy

### 1. Go to Cloud Run
GCP Console → **Cloud Run** → **Create Service**

### 2. Choose source
**"Continuously deploy from a repository"** → **Set up with Cloud Build**

### 3. Connect GitHub
- Provider: **GitHub**
- Authenticate → select repo (`Canvas - Ticketing Site`)
- Branch: `^main$`

### 4. Build configuration
| Field | Value |
|---|---|
| Build type | Dockerfile |
| Dockerfile location | `backend/Dockerfile` |
| Build context directory | `backend` |

> `backend` as context is required — prevents the frontend directory from being copied into the container.

### 5. Service settings
| Field | Value |
|---|---|
| Service name | `canvas-backend` |
| Region | `asia-south1` (Mumbai) |
| CPU allocation | Only during request processing |
| Min instances | `0` |
| Max instances | `3` |
| Allow unauthenticated requests | ✅ Yes |
| Container port | `8080` |

### 6. Environment variables
Add under **Container → Variables & Secrets**. Do **not** add `PORT` — Cloud Run injects it.

| Key | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase **Transaction pooler** URL (port 6543, append `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase **Direct connection** URL (port 5432) |
| `SUPABASE_URL` | Same as Railway |
| `SUPABASE_ANON_KEY` | Same as Railway |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as Railway |
| `SUPABASE_STORAGE_BUCKET` | Same as Railway |
| `UPSTASH_REDIS_REST_URL` | Same as Railway |
| `UPSTASH_REDIS_REST_TOKEN` | Same as Railway |
| `JWT_ACCESS_SECRET` | Same as Railway |
| `JWT_REFRESH_SECRET` | Same as Railway |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `CLIENT_URL` | Vercel frontend URL |
| `TELEGRAM_BOT_TOKEN` | Same as Railway |
| `TELEGRAM_CHAT_ID` | Same as Railway |
| `CRON_SECRET` | A long random string. Cloud Scheduler must send this in the `x-cron-secret` header (see Phase 7). Must match the value configured in the Scheduler jobs. |
| `SMTP_HOST` | Same as Railway |
| `SMTP_PORT` | Same as Railway |
| `SMTP_USER` | Same as Railway |
| `SMTP_PASS` | Same as Railway |
| `EMAIL_FROM` | Same as Railway |
| `SENDGRID_API_KEY` | Same as Railway |

### 7. Deploy
Click **Create** — Cloud Build builds the image and deploys. Takes 3–5 minutes.

You'll get a URL like:
```
https://canvas-backend-xxxxxxxx-el.a.run.app
```

---

## Phase 4 — Test Before Switching

Railway and Vercel remain untouched. Test the GCP URL directly:

```bash
# Health check
curl https://canvas-backend-xxxxxxxx-el.a.run.app/api/health

# Test login
curl -X POST https://canvas-backend-xxxxxxxx-el.a.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Also test via Postman — hit ticket endpoints, analytics, file uploads.

---

## Phase 5 — Switch Frontend (after tests pass)

Vercel → frontend project → **Settings → Environment Variables**:

```
VITE_API_URL=https://canvas-backend-xxxxxxxx-el.a.run.app
```

Redeploy the frontend. Live site now points to GCP.

---

## Phase 6 — Decommission Railway

After 1–2 days of stable GCP usage:

1. Railway dashboard → backend service → **Delete service**
2. Railway Postgres (if applicable) → delete separately

---

## Phase 7 — Telegram Reports via Cloud Scheduler

> **Why:** Cloud Run scales to zero (Min instances = 0), so the old in-process
> `node-cron` never fired — the container is dead at 9 AM. Cloud Scheduler runs
> independently and wakes the service with an HTTP call, which is the correct
> serverless pattern. (node-cron has been removed from the code.)

The backend exposes `POST /api/telegram/cron/:type` (`type` = `daily` or `monthly`),
guarded by the `x-cron-secret` header which must equal the `CRON_SECRET` env var.

### 1. Enable the API (Cloud Shell)

```bash
gcloud services enable cloudscheduler.googleapis.com
```

### 2. Create the daily job (9:00 AM IST, every day)

```bash
gcloud scheduler jobs create http canvas-telegram-daily \
  --location=asia-south1 \
  --schedule="0 9 * * *" \
  --time-zone="Asia/Kolkata" \
  --uri="https://canvas-backend-xxxxxxxx-el.a.run.app/api/telegram/cron/daily" \
  --http-method=POST \
  --headers="x-cron-secret=YOUR_CRON_SECRET"
```

### 3. Create the weekly job (9:00 AM IST, every Tuesday — 30-day snapshot)

```bash
gcloud scheduler jobs create http canvas-telegram-weekly \
  --location=asia-south1 \
  --schedule="0 9 * * 2" \
  --time-zone="Asia/Kolkata" \
  --uri="https://canvas-backend-xxxxxxxx-el.a.run.app/api/telegram/cron/monthly" \
  --http-method=POST \
  --headers="x-cron-secret=YOUR_CRON_SECRET"
```

Replace `canvas-backend-xxxxxxxx-el.a.run.app` with your real Cloud Run URL and
`YOUR_CRON_SECRET` with the same value you set for the `CRON_SECRET` env var.

### 4. Test it immediately (don't wait until 9 AM)

```bash
gcloud scheduler jobs run canvas-telegram-daily --location=asia-south1
```

You should receive the Telegram report within a few seconds. You can also curl the
endpoint directly:

```bash
curl -X POST https://canvas-backend-xxxxxxxx-el.a.run.app/api/telegram/cron/daily \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

> Prefer the Console? **Cloud Scheduler → Create Job** → set the schedule, time
> zone `Asia/Kolkata`, target **HTTP**, the URL above, method **POST**, and add a
> header `x-cron-secret` = your secret.

---

## Ongoing Deploys

Every push to `main` auto-triggers a redeploy:

```
git push origin main  →  Cloud Build  →  new image  →  Cloud Run redeploys
```

### Merge dev → main

```bash
git pull origin dev
git checkout main
git pull origin main
git merge dev
git push origin main
git checkout dev
```

---

## Billing Notes

- Cloud Run free tier: 2M requests/month + 360k GB-seconds — sufficient for this workload
- Resources **suspend** (not charge) when free tier or trial credits are exhausted
- Billing linked to nabin@canvaswork.co — charges draw from YC credits
