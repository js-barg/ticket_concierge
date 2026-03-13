# Scripts

Helper scripts for local and deployment workflows. Run from the repository root.

## build-container.sh

Build the production Docker image locally (same Dockerfile used by Cloud Build).

```bash
./scripts/build-container.sh
# or with a tag:
./scripts/build-container.sh my-registry.io/myapp:v1
```

## run-production-local.sh

Run the built production image locally. Requires a `.env` file and a reachable database (e.g. local Postgres or Cloud SQL Proxy).

```bash
./scripts/build-container.sh
./scripts/run-production-local.sh 3000
```

## Production migrations

Migrations are **not** run inside the app container. Run them once per deployment (or when schema changes) using a machine or job that can reach Cloud SQL:

```bash
# Set DATABASE_URL to your Cloud SQL connection (or use Cloud SQL Proxy).
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

You can run this in Cloud Build as an extra step, or as a one-off Cloud Run Job, or from a local machine with network access to Cloud SQL.
