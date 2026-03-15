# Step-by-step: Test locally

Use this guide to run the app and test event pages, themes, and checkout on your machine.

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Docker Desktop** (or Docker Engine) for PostgreSQL
- **Stripe** test keys (Dashboard → Developers → API keys)
- Optional: **Stripe CLI** for local webhook forwarding (order creation after payment)

---

## 1. Clone and install

```bash
cd c:\development\ticket_concierge
npm install
```

---

## 2. Environment file

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Example (local) |
|----------|------------------|
| `DATABASE_URL` | **Use `localhost`** — see below |
| `NEXTAUTH_SECRET` | Any string ≥ 32 characters (e.g. `my-local-dev-secret-32-chars-min`) |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `APP_BASE_URL` | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | From Stripe CLI in step 6, or a placeholder until you run `stripe listen` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` from Stripe Dashboard |

**Important — `DATABASE_URL` host:**

- **App and Prisma run on your machine** (this guide: DB in Docker, `npm run dev` on host):  
  Use **`localhost`** so your machine can reach Postgres:
  ```env
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/ticket_concierge
  ```
- **App runs inside Docker** (e.g. `docker compose up` for both app and db):  
  Use **`db`** (the Docker service name):
  ```env
  DATABASE_URL=postgres://postgres:postgres@db:5432/ticket_concierge
  ```
  Migrations would then need to run inside the app container or with a URL that reaches the DB (e.g. `localhost` from host).

---

## 3. Start the database

In a terminal:

```bash
docker compose up -d db
```

Wait until Postgres is ready (a few seconds). Check with:

```bash
docker compose ps
```

`db` should be “Up”.

---

## 4. Database migrations and seed

In the **same project folder** (and with `DATABASE_URL` pointing at `localhost` if the app runs on the host):

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates tables and seeds a sample event (e.g. “Hamilton”), dates, zones, and users.

---

## 5. Start the app

**Option A — App on your machine (recommended for dev)**

```bash
npm run dev
```

Use `DATABASE_URL` with `localhost` in `.env`.

**Option B — App in Docker with DB**

```bash
docker compose up
```

Use `DATABASE_URL` with host `db` in `.env`. Migrations/seed from step 4 should be run with a URL that reaches the DB (e.g. `localhost` when the port is mapped).

---

## 6. (Optional) Stripe webhooks for local order creation

To have orders created in your local DB after a test payment:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Log in: `stripe login`
3. In a **second terminal**:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the **webhook signing secret** (e.g. `whsec_...`) and set it in `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Restart the app (step 5) so it picks up the new secret.

---

## 7. Open the app in the browser

- **Home:** [http://localhost:3000](http://localhost:3000)
- **Sample event (after seed):** [http://localhost:3000/hamilton-dr-phillips-center](http://localhost:3000/hamilton-dr-phillips-center)
- **Admin login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

**Seed logins:**

- Admin: `admin@example.com` / `password`
- Fulfillment: `fulfillment@example.com` / `password`

---

## 8. What to test

### Event page and theme

1. Go to the event page (e.g. `/hamilton-dr-phillips-center`).
2. Select a **date** and a **zone**.
3. Change **quantity** and confirm the price summary updates.
4. Check that colors (borders, selected state, “Continue to checkout” button) use the event theme (e.g. Dark & Gold from seed).

### Admin theme presets

1. Log in at `/admin/login` as admin.
2. Go to **Parent Events** → open the sample event → **Edit**.
3. Use **“Quick theme (event page + Stripe Checkout)”** and choose a preset (e.g. Navy & White).
4. Save. Reopen the public event page and confirm the theme changed; the checkout button and Stripe page will use the same theme.

### Checkout (Stripe test mode)

1. On the event page, select date, zone, quantity; enter name and email.
2. Click **Continue to checkout**.
3. You should be redirected to Stripe Checkout (test mode). Confirm **background and button colors** match the event theme and the **business name** is the event title.
4. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. After payment, you should land on the success page. If you ran `stripe listen` and set `STRIPE_WEBHOOK_SECRET`, the order should appear in **Admin → Orders** and **Fulfillment Queue**.

### Admin and reports

- **Orders:** [http://localhost:3000/admin/orders](http://localhost:3000/admin/orders)
- **Fulfillment queue:** [http://localhost:3000/admin/queue](http://localhost:3000/admin/queue)
- **Reports:** [http://localhost:3000/admin/reports](http://localhost:3000/admin/reports) — generate a daily report or export CSV.

---

## 9. Stop services

- **App only (npm run dev):** `Ctrl+C` in the terminal where it’s running.
- **Docker:** `docker compose down` (add `-v` only if you want to remove the DB volume and lose data).

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Can’t reach database” / “db:5432” | You’re running Prisma or the app on your machine, but `DATABASE_URL` uses host `db`. Change it to `localhost`: `postgres://postgres:postgres@localhost:5432/ticket_concierge`. |
| “NEXTAUTH_SECRET is not set” | Set `NEXTAUTH_SECRET` in `.env` (≥ 32 characters). |
| Checkout returns 400 / Invalid API key | Check `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test keys, no extra spaces). |
| Order not created after payment | Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and set the printed secret in `STRIPE_WEBHOOK_SECRET`, then restart the app. |
| Migrations fail | Ensure the DB is up and `DATABASE_URL` is correct; run `npx prisma migrate dev` again. |
