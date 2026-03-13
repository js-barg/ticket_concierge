## Ticket Concierge — MVP

A single repository supports **local development** and **production on Google Cloud Run** with the same codebase. No product or business-rule changes between environments; only configuration (env vars and database) differs.

### Stack

- **App**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL (Docker Compose locally; Cloud SQL in production)
- **Runtime**: Node.js, Docker, Cloud Run–ready container

---

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`: set `DATABASE_URL` to `postgres://postgres:postgres@db:5432/ticket_concierge` when using Docker Compose, or `@localhost:5432/...` if Postgres runs on the host.

3. **Start Postgres and app**

   ```bash
   docker compose up --build
   ```

4. **Migrations and seed** (in another terminal)

   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Open **http://localhost:3000**. Admin: **http://localhost:3000/admin/login** — after seed: `admin@example.com` / `password`, `fulfillment@example.com` / `password`.

### Local Prisma

- Develop: `npx prisma migrate dev`
- Studio: `npx prisma studio`

### Local Stripe testing

- Use test keys in `.env` (`sk_test_...`, `whsec_...`, `pk_test_...`).
- Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

---

## Production deployment (Cloud Run)

The app runs on **Google Cloud Run** with **Cloud SQL (PostgreSQL)**. Deployment is triggered from **GitHub** via **Cloud Build**. The same repo and Dockerfile are used; only environment variables and the database URL change.

### Build production container locally (optional)

```bash
./scripts/build-container.sh
# Run it locally (needs a reachable DB and .env):
./scripts/run-production-local.sh 3000
```

### Environment variables (production)

Set these on the Cloud Run service (or via Secret Manager). Do **not** commit real values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Set by Cloud Run; default 3000 |
| `DATABASE_URL` | Yes | Cloud SQL connection string (e.g. Unix socket or private IP) |
| `NEXTAUTH_SECRET` | Yes | Session secret (min 32 chars); use Secret Manager |
| `NEXTAUTH_URL` | Yes | Full app URL (e.g. `https://your-service-xxx.run.app`) |
| `APP_BASE_URL` | Yes | Same as `NEXTAUTH_URL` for callbacks and links |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (live in prod) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `FROM_EMAIL` | No | Sender for email (when provider is configured) |
| `RESEND_API_KEY` | No | Or other email provider when implemented |

See `.env.production.example` for a full checklist. Optional: `DIRECT_DATABASE_URL` for migrations if you use a pooler for the app.

### Prisma migrations in production

Migrations are **not** run inside the app container. Run them when the schema changes:

- **Option A**: From a machine with network access to Cloud SQL (or Cloud SQL Proxy):

  ```bash
  export DATABASE_URL="postgresql://..."
  npx prisma migrate deploy
  ```

- **Option B**: Add a Cloud Build step that runs a one-off migration container or `gcloud run jobs` with `prisma migrate deploy`.
- **Option C**: Run a one-off Cloud Run Job that executes `prisma migrate deploy`.

Use the same `DATABASE_URL` (or `DIRECT_DATABASE_URL` if you use pooling) that points to your Cloud SQL instance.

### GitHub → Cloud Build → Cloud Run

1. **Repo**: Push to `main` (or your chosen branch).
2. **Cloud Build**: Trigger runs `cloudbuild.yaml` — builds the Docker image, pushes to Artifact Registry, deploys to Cloud Run.
3. **Cloud Run**: New revision uses the new image; env vars and secrets are already configured on the service.

Substitutions in `cloudbuild.yaml` (override in the trigger if needed):

- `_REGION` — e.g. `us-central1`
- `_SERVICE_NAME` — Cloud Run service name (e.g. `ticket-concierge-web`)
- `_ARTIFACT_REPO` — Artifact Registry repository name (e.g. `ticket-concierge`)

---

## What to configure in Google Cloud

1. **Project**: Create or select a GCP project; enable billing if needed.
2. **APIs**: Enable **Cloud Run**, **Artifact Registry**, **Cloud Build**, **Secret Manager**, **Cloud SQL Admin** (and **Cloud SQL** if using Cloud SQL).
3. **Artifact Registry**: Create a repository (e.g. `ticket-concierge`) in your chosen region.
4. **Cloud SQL**: Create a PostgreSQL instance and database (e.g. `ticket_concierge`). Note the connection name and set `DATABASE_URL` (and optionally `DIRECT_DATABASE_URL`) for Cloud Run and for migration runs.
5. **Secret Manager**: Create secrets for `NEXTAUTH_SECRET`, `DATABASE_URL`, Stripe keys, etc. Optionally reference them in Cloud Run (e.g. “Secret Manager” tab when editing the service).
6. **Cloud Run service**: Create the service (or let the first deploy create it). Configure all required environment variables and/or secret references. Set the service account so it can reach Cloud SQL and Secret Manager if needed.
7. **Cloud Build**: Connect the GitHub repo; create a trigger that runs on push to `main`, uses this repo’s `cloudbuild.yaml`, and uses the default or overridden substitutions.

---

## What to configure in GitHub / Cloud Build trigger

1. **GitHub**: Repository is the source of truth; no secrets in the repo.
2. **Cloud Build trigger**:  
   - **Event**: Push to branch (e.g. `main`).  
   - **Source**: Connected GitHub repo; branch `main` (or your default).  
   - **Config**: Cloud Build config file; path `cloudbuild.yaml`.  
   - **Substitutions**: Optionally set `_REGION`, `_SERVICE_NAME`, `_ARTIFACT_REPO` if you don’t use the defaults in `cloudbuild.yaml`.
3. **Permissions**: Cloud Build’s service account needs roles to push to Artifact Registry and deploy to Cloud Run (and read secrets if you inject them in the build).

---

## Reporting and scheduled tasks (Phase 9)

- **Reports**: `/admin/reports` — generate daily reports, date-range export, unfulfilled-orders CSV.
- **Scheduled logic**: `lib/reports.ts`, `lib/sweeps.ts` — report generation, cutoff/completion sweeps, notification retry placeholder. For production, call `/api/reports/daily` (POST) or `/api/sweeps` (POST) from **Cloud Scheduler** or a **Cloud Run Job** (with auth/IAM as appropriate).

---

## Files reference

| Path | Purpose |
|------|---------|
| `Dockerfile` | Production app image (Cloud Run); not used for local dev app process |
| `docker-compose.yml` | Local Postgres + app dev server |
| `cloudbuild.yaml` | Build image, push to Artifact Registry, deploy to Cloud Run |
| `.dockerignore` | Keeps `.env` and unneeded files out of the image |
| `.env.example` | Local dev env template |
| `.env.production.example` | Production env checklist (no real secrets) |
| `scripts/build-container.sh` | Build production image locally |
| `scripts/run-production-local.sh` | Run production image locally |
| `scripts/README.md` | Script and migration notes |

### Stateless design

- The app does **not** persist data on the container filesystem. All persistent data is in PostgreSQL (or Stripe, etc.).
- Storage and email are abstracted so you can plug in Google Cloud Storage and an email provider later without changing business logic.

