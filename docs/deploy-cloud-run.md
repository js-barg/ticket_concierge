# Deploy Ticket Concierge to Google Cloud Run (Project: ticket-concierge)

Step-by-step instructions to deploy this app to Cloud Run with Cloud SQL (PostgreSQL) and Secret Manager. Replace any placeholder values (e.g. passwords, Stripe keys) with your real values—**never commit them**.

---

## Prerequisites

- Google Cloud project **ticket-concierge** created and billing enabled.
- [gcloud CLI](https://cloud.google.com/sdk/gcloud) installed and logged in: `gcloud auth login`.
- Project set: `gcloud config set project ticket-concierge`

---

## Step 1: Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

---

## Step 2: Create Artifact Registry repository

```bash
export REGION=us-central1
export REPO=ticket-concierge

gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Ticket Concierge container images"
```

---

## Step 3: Create Cloud SQL instance and database

**3a. Create the instance** (takes several minutes):

```bash
export DB_INSTANCE=ticket-concierge-db

gcloud sql instances create "$DB_INSTANCE" \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="$REGION" \
  --root-password=CHANGE_ME_ROOT_PASSWORD
```

Use a strong password for `--root-password`; you’ll use it only for creating the app user.

**3b. Create the application database and user:**

```bash
export DB_NAME=ticket_concierge
export DB_USER=ticket_concierge_app
export DB_PASSWORD=CHANGE_ME_APP_PASSWORD

# Create database
gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE"

# Create user for the app (not root)
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD"
```

Replace `CHANGE_ME_APP_PASSWORD` with a strong password and store it somewhere safe.

**3c. Get the instance connection name** (used later for Cloud Run and `DATABASE_URL`):

```bash
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE" --format='value(connectionName)')
echo "$INSTANCE_CONNECTION_NAME"
# Example: ticket-concierge:us-central1:ticket-concierge-db
```

---

## Step 4: Create Secret Manager secrets

The app expects **one** `DATABASE_URL` and other secrets. Create each secret with a value; use the same `REGION` (or `us-central1`).

**4a. DATABASE_URL**

Format for Cloud Run + Cloud SQL (Unix socket):

`postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME`

Use the values from Step 3 (and the connection name from 3c):

```bash
export PROJECT_ID=ticket-concierge
export DATABASE_URL_VALUE="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

echo -n "$DATABASE_URL_VALUE" | gcloud secrets create DATABASE_URL \
  --data-file=- \
  --replication-policy=automatic
```

**4b. NEXTAUTH_SECRET** (min 32 characters):

```bash
echo -n "your-random-secret-at-least-32-characters-long" | gcloud secrets create NEXTAUTH_SECRET --data-file=- --replication-policy=automatic
```

Generate a random string (e.g. `openssl rand -base64 32`) and use that instead of the placeholder.

**4c. Stripe and other app secrets:**

```bash
# Replace with your live Stripe keys
echo -n "sk_live_xxxx" | gcloud secrets create STRIPE_SECRET_KEY --data-file=- --replication-policy=automatic
echo -n "whsec_xxxx"  | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=- --replication-policy=automatic
```

---

## Step 5: Create Cloud Run service account

```bash
export SA_NAME=ticket-concierge-sa
export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_NAME" \
  --display-name="Ticket Concierge Cloud Run"
```

**Grant Cloud SQL client** (so the app can connect via Unix socket):

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client"
```

**Grant Secret Manager secret accessor** (so the app can read the secrets you created):

```bash
for SECRET in DATABASE_URL NEXTAUTH_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Step 6: Build and push the container image

From your **local machine** in the project root (where `Dockerfile` is):

```bash
export PROJECT_ID=ticket-concierge
export REGION=us-central1
export REPO=ticket-concierge
export SERVICE=ticket-concierge-web

# Configure Docker for Artifact Registry
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# Build the image (same Dockerfile as in the repo)
docker build -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest" .

# Push
docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest"
```

Alternatively, use the script: `./scripts/build-container.sh "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest"` then push the tag above.

---

## Step 7: Deploy to Cloud Run

**7a. Set your Cloud Run URL**

After the first deploy you’ll get a URL like `https://ticket-concierge-web-xxxxx-uc.a.run.app`. For the **first** deploy, use a placeholder; after deploy, run the command again with the real URL (see 7c).

```bash
export CLOUD_RUN_URL="https://ticket-concierge-web-xxxxx-uc.a.run.app"
```

**7b. Deploy with Cloud SQL and secrets**

```bash
gcloud run deploy "$SERVICE" \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$INSTANCE_CONNECTION_NAME" \
  --set-env-vars "NODE_ENV=production,APP_BASE_URL=${CLOUD_RUN_URL},NEXTAUTH_URL=${CLOUD_RUN_URL}" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest"
```

**Public Stripe key** (non-secret; set as env var):

If you need `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, add it to the same deploy:

```bash
gcloud run deploy "$SERVICE" \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$INSTANCE_CONNECTION_NAME" \
  --set-env-vars "NODE_ENV=production,APP_BASE_URL=${CLOUD_RUN_URL},NEXTAUTH_URL=${CLOUD_RUN_URL},NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest"
```

**7c. Get the real URL and update env vars**

After the first deploy:

```bash
gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
```

Set that URL as `CLOUD_RUN_URL`, then run the same `gcloud run deploy` command again so `APP_BASE_URL` and `NEXTAUTH_URL` point to the actual URL.

---

## Step 8: Run database migrations

The app does **not** run migrations automatically. Run them once (or after schema changes) from a place that can reach Cloud SQL.

**Option A: Cloud SQL Auth Proxy on your machine**

1. Install [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy).
2. Start the proxy (use the same `INSTANCE_CONNECTION_NAME` and a free local port):

   ```bash
   cloud-sql-proxy "$INSTANCE_CONNECTION_NAME"
   ```

3. In another terminal, set `DATABASE_URL` to the proxy (e.g. `postgresql://ticket_concierge_app:PASSWORD@127.0.0.1:5432/ticket_concierge`) and run:

   ```bash
   npx prisma migrate deploy
   ```

**Option B: From a one-off Cloud Run Job or a GCE VM** that has Cloud SQL access and the same `DATABASE_URL` format (e.g. Unix socket or private IP). Run `npx prisma migrate deploy` there.

---

## Step 9: Stripe webhook (production)

In the Stripe Dashboard, add a webhook endpoint for your production URL:

- URL: `https://YOUR_CLOUD_RUN_URL/api/stripe/webhook`
- Events: `checkout.session.completed` (and any others you use)

Set the signing secret in Secret Manager as `STRIPE_WEBHOOK_SECRET` (you did this in Step 4) and redeploy if you had already deployed before creating the secret.

---

## Troubleshooting: event page or “Application error”

If the main page loads but an event page (e.g. `/hamilton-dr-phillips-center`) shows **Application error**:

1. **Check Cloud Run logs**  
   In GCP Console: **Cloud Run** → your service → **Logs**. Look for lines starting with `[EventPage getParentEventPageData]`. The next line is the real error (e.g. DB connection failed, invalid URL).

2. **Database connection**
   - Ensure **DATABASE_URL** is set on the Cloud Run service (via the secret you created). If the secret is missing or the service account can’t access it, the env var will be empty and Prisma will throw.
   - **Cloud SQL instance**: the service must have `--add-cloudsql-instances` set to your instance connection name (e.g. `ticket-concierge:us-central1:ticket-concierge-db`).
   - **Password in DATABASE_URL**: if the DB password contains `@`, `#`, `:`, `/`, or `%`, it must be [URL-encoded](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) in the secret value (e.g. `%40` for `@`).

3. **Migrations**  
   If the database is empty or schema is missing, run `npx prisma migrate deploy` (see Step 8). The event page needs the `parent_events`, `event_dates`, `zones` tables and seed data (or your own data).

4. **Service account**  
   The Cloud Run service account needs **Cloud SQL Client** and **Secret Manager Secret Accessor** on the secrets. Without these, the app can’t connect to the DB or read DATABASE_URL.

---

## Summary: variables used in this guide

| Variable | Example / note |
|----------|----------------|
| `PROJECT_ID` | `ticket-concierge` |
| `REGION` | `us-central1` |
| `REPO` | `ticket-concierge` (Artifact Registry repo) |
| `SERVICE` | `ticket-concierge-web` (Cloud Run service) |
| `DB_INSTANCE` | `ticket-concierge-db` |
| `DB_NAME` | `ticket_concierge` |
| `DB_USER` | `ticket_concierge_app` |
| `SA_NAME` | `ticket-concierge-sa` |
| `INSTANCE_CONNECTION_NAME` | From `gcloud sql instances describe ...` |

---

## Updating the deployment

After code or env changes:

1. Rebuild and push the image (Step 6).
2. Redeploy (Step 7b; reuse the same `CLOUD_RUN_URL` and secrets).
3. If the Prisma schema changed, run migrations again (Step 8).

For CI/CD, use the repo’s `cloudbuild.yaml` and a Cloud Build trigger; configure the Cloud Run service’s env vars and secrets once in the console or via the same `gcloud run deploy` flags so each build only needs to deploy the new image.
