# Production Dockerfile for Ticket Concierge (Cloud Run).
# Local development uses docker-compose; this file is for building the app image only.
# Migrations are not run in the container; run `prisma migrate deploy` separately.

FROM node:20-alpine AS base
ENV NODE_ENV=production

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./ 2>/dev/null || true
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run sets PORT at runtime; default for local container runs.
ENV PORT=3000
EXPOSE 3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Next.js standalone reads PORT from environment.
CMD ["node", "server.js"]

