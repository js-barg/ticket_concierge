## Ticket Concierge — Phase 1 Foundation

This repository contains the **Phase 1 foundation** for the Ticket Concierge platform: a local-first, Google Cloud Run–compatible scaffold using **Next.js**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, and **Docker**.

No business logic, admin features, checkout, payments, reporting, or fulfillment flows are implemented yet.

### Stack

- **App**: Next.js (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL (via Docker in local dev)
- **Runtime**: Node.js, Docker, Cloud Run–ready container

### Getting Started (Local)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Start Postgres and the app via Docker Compose:

   ```bash
   docker compose up --build
   ```

4. In another terminal, run Prisma migrations and seed:

   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Visit `http://localhost:3000` to see the scaffold.

### Admin (Phase 4)

- **Login**: Go to `http://localhost:3000/admin/login`. Seeded users (after `npx prisma db seed`):
  - **Admin**: `admin@example.com` / `password`
  - **Fulfillment**: `fulfillment@example.com` / `password`
- In development, a fallback secret is used if `NEXTAUTH_SECRET` is not set (so login works without `.env`). To silence NextAuth warnings and use a stable session, add to `.env`: `NEXTAUTH_SECRET` (min 32 chars) and `NEXTAUTH_URL=http://localhost:3000`. In production, set `NEXTAUTH_SECRET` (e.g. from Secret Manager).

### Environment Configuration

- **Configuration is env-based only**; no runtime configuration is stored on disk.
- `.env.example` documents the required environment variables for local development.
- Cloud Run will inject `PORT` and other secrets via environment variables / Secret Manager in later phases.

### Docker / Cloud Run Compatibility

- `Dockerfile` builds a standalone Next.js app suitable for Cloud Run.
- The app is **stateless**; all persistent data is expected to live in PostgreSQL (or other external services in later phases).

### Prisma

- Prisma is configured to use PostgreSQL with `DATABASE_URL`.
- Phase 1 defines only a minimal `User` model to keep the ORM pipeline wired.
- Use standard Prisma workflows:

  ```bash
  npx prisma migrate dev
  npx prisma studio
  ```

### Phase 1 Scope

This foundation intentionally **does not** include:

- Event, zone, or order models beyond the minimal user scaffold
- Admin CRUD UI
- Checkout or payment processing
- Reporting or fulfillment workflows

Those will be layered on in later phases once the foundation is validated.

