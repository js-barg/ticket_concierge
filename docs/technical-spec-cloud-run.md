# Ticket Concierge Site — Technical Implementation Specification (Google Cloud Run)

## 1. Purpose

This document defines the engineering implementation for a ticket concierge platform designed to run on **Google Cloud**, with the primary application deployed on **Cloud Run**.

The system must support:
- one public page per parent event
- multiple event dates inside the same public page
- admin management for events, dates, zones, pricing, images, and fulfillment
- order processing and payment integration
- fulfillment queue and email notifications
- daily reporting and scheduled maintenance tasks

---

## 2. Recommended Google Cloud Architecture

## 2.1 Core Runtime

### Primary App Runtime
- **Google Cloud Run** for the main web application
  - runs the public site and admin dashboard in a containerized service
  - supports HTTP services and autoscaling
  - deploy from container images stored in Artifact Registry

### Batch / Scheduled Work
Use either:
- **Cloud Run Jobs** for run-to-completion tasks such as daily reports, cleanup, or reconciliation, or
- a secured admin API endpoint triggered by **Cloud Scheduler**

Recommended split:
- daily report generation: Cloud Run Job
- simple timed admin actions: Scheduler -> Cloud Run endpoint

## 2.2 Recommended Stack

### Application Framework
- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM**

### Database
- **Cloud SQL for PostgreSQL**

### Storage
- **Google Cloud Storage** for:
  - hero images
  - supporting images
  - seating map uploads
  - printable ticket documents if needed
  - fulfillment attachments

### Secrets
- **Secret Manager** for:
  - database connection strings
  - Stripe secret keys
  - email service API keys
  - session secrets
  - third-party credentials

### Container Registry
- **Artifact Registry** for container images deployed to Cloud Run

### Scheduling / Maintenance
- **Cloud Scheduler** for:
  - daily sales report triggers
  - nightly event/date cutoff sweeps
  - stale event cleanup
  - reminder notifications

### Payments
- **Stripe** as primary payment processor
- optional later support for PayPal or Square

---

## 3. Recommended GCP Deployment Topology

## 3.1 Primary Services

### Cloud Run Service: `ticket-concierge-web`
Hosts:
- public customer-facing event pages
- checkout initiation
- admin dashboard
- internal APIs

### Cloud SQL Instance: `ticket-concierge-postgres`
Stores:
- events
- event dates
- zones
- orders
- users
- fulfillment activity
- reports metadata

### Cloud Storage Bucket(s)
Suggested buckets:
- `ticket-concierge-public-assets`
- `ticket-concierge-private-attachments`

### Secret Manager
Secrets such as:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `SESSION_SECRET`
- `NEXTAUTH_SECRET` or equivalent

### Scheduled Execution
One of these patterns:
1. **Cloud Scheduler -> authenticated HTTP call -> Cloud Run service endpoint**
2. **Cloud Scheduler -> trigger Cloud Run Job**

---

## 4. Application Architecture

## 4.1 Recommended App Structure
One repository, one main Cloud Run service for MVP.

Suggested app areas:
- `/app/(public)` public event landing pages
- `/app/admin` admin dashboard
- `/app/api` server-side route handlers / API endpoints
- `/lib` domain logic, DB, pricing engine, auth, email, storage helpers
- `/prisma` schema and migrations

## 4.2 Runtime Separation
For MVP, use a **single Cloud Run service** hosting both public and admin surfaces.

Later, if scale or security needs increase, split into:
- public web service
- admin API service
- worker/job service

## 4.3 Stateless Service Design
Cloud Run services are stateless by design, so the app must:
- store all persistent data in Cloud SQL or Cloud Storage
- not rely on local filesystem persistence
- treat container instances as ephemeral

---

## 5. Environment Configuration

Recommended environment variables / secrets:

- `NODE_ENV`
- `APP_BASE_URL`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL` (optional for Prisma migrations)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `SESSION_SECRET`
- `GCS_PUBLIC_BUCKET`
- `GCS_PRIVATE_BUCKET`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_REGION`

Use Secret Manager for sensitive values and regular environment variables for non-secret configuration.

---

## 6. Recommended Database Schema

Use **PostgreSQL on Cloud SQL** with Prisma migrations.

## 6.1 Users

### `users`
- `id` UUID PK
- `email` text unique not null
- `name` text not null
- `role` enum(`ADMIN`,`FULFILLMENT`,`FINANCE`)
- `is_active` boolean default true
- `created_at` timestamptz
- `updated_at` timestamptz

## 6.2 Parent Events

### `parent_events`
- `id` UUID PK
- `slug` text unique not null
- `title` text not null
- `venue_name` text not null
- `category` text not null
- `marketing_headline` text null
- `subheadline` text null
- `event_description` text null
- `layout_template` text not null
- `primary_color` text null
- `secondary_color` text null
- `accent_color` text null
- `text_theme` text null
- `hero_image_url` text null
- `mobile_hero_image_url` text null
- `disclosure_block` text null
- `default_cutoff_hours` integer null
- `default_markup_type` enum(`PERCENT`,`FLAT`) null
- `default_markup_value` numeric(10,2) null
- `default_margin_buffer` numeric(10,2) null
- `default_service_fee_type` enum(`PER_ORDER_FLAT`,`PER_TICKET_FLAT`,`PERCENT`) null
- `default_service_fee_value` numeric(10,2) null
- `is_active` boolean default true
- `created_at` timestamptz
- `updated_at` timestamptz

## 6.3 Parent Event Images

### `parent_event_images`
- `id` UUID PK
- `parent_event_id` UUID FK -> parent_events.id
- `image_url` text not null
- `sort_order` integer default 0
- `alt_text` text null
- `created_at` timestamptz

## 6.4 Event Dates

### `event_dates`
- `id` UUID PK
- `parent_event_id` UUID FK -> parent_events.id
- `performance_at` timestamptz not null
- `timezone` text not null
- `visibility_status` enum(`VISIBLE`,`HIDDEN`) default `VISIBLE`
- `sale_status` enum(`DRAFT`,`LIVE`,`CUTOFF`,`SOLD_OUT`,`COMPLETED`,`ARCHIVED`) default `DRAFT`
- `sell_cutoff_at` timestamptz not null
- `quantity_cap` integer null
- `assigned_buyer_user_id` UUID FK -> users.id null
- `notes` text null
- `created_at` timestamptz
- `updated_at` timestamptz

Index recommendations:
- index on `(parent_event_id, performance_at)`
- index on `(sale_status, sell_cutoff_at)`

## 6.5 Seating Maps

### `event_date_assets`
- `id` UUID PK
- `event_date_id` UUID FK -> event_dates.id
- `asset_type` enum(`SEATING_MAP`,`DOCUMENT`,`OTHER`)
- `asset_url` text not null
- `label` text null
- `created_at` timestamptz

## 6.6 Zones

### `zones`
- `id` UUID PK
- `event_date_id` UUID FK -> event_dates.id
- `zone_name` text not null
- `customer_description` text null
- `display_order` integer default 0
- `map_region_key` text null
- `source_section_mapping` jsonb null
- `source_observed_cost` numeric(10,2) not null
- `markup_type` enum(`INHERIT`,`PERCENT`,`FLAT`) default `INHERIT`
- `markup_value` numeric(10,2) null
- `margin_buffer_value` numeric(10,2) null
- `service_fee_type` enum(`INHERIT`,`PER_ORDER_FLAT`,`PER_TICKET_FLAT`,`PERCENT`) default `INHERIT`
- `service_fee_value` numeric(10,2) null
- `public_price` numeric(10,2) null
- `available_quantity` integer not null
- `min_purchase_qty` integer default 1
- `max_purchase_qty` integer null
- `fulfillment_type` enum(`ETICKET`,`PRINT`,`WILL_CALL`) not null
- `is_active` boolean default true
- `notes` text null
- `created_at` timestamptz
- `updated_at` timestamptz

Index recommendations:
- index on `(event_date_id, is_active, display_order)`

## 6.7 Orders

### `orders`
- `id` UUID PK
- `order_number` text unique not null
- `parent_event_id` UUID FK -> parent_events.id
- `event_date_id` UUID FK -> event_dates.id
- `zone_id` UUID FK -> zones.id
- `customer_name` text not null
- `customer_email` text not null
- `customer_phone` text null
- `quantity` integer not null
- `seats_together_expected` boolean default true
- `fulfillment_type` enum(`ETICKET`,`PRINT`,`WILL_CALL`) not null
- `source_cost_estimate_total` numeric(10,2) not null
- `markup_amount_total` numeric(10,2) not null
- `margin_buffer_amount_total` numeric(10,2) not null
- `service_fee_amount_total` numeric(10,2) not null
- `subtotal_amount` numeric(10,2) not null
- `tax_amount` numeric(10,2) default 0
- `total_amount` numeric(10,2) not null
- `payment_provider` enum(`STRIPE`,`PAYPAL`,`SQUARE`) not null
- `payment_status` enum(`PENDING`,`AUTHORIZED`,`PAID`,`FAILED`,`REFUNDED`,`PARTIALLY_REFUNDED`) not null
- `fulfillment_status` enum(`NEW`,`IN_PROGRESS`,`ACQUIRED`,`DELIVERED`,`EXCEPTION`,`CANCELLED`) not null
- `delivery_status` enum(`PENDING`,`SENT`,`DELIVERED`,`PICKUP_READY`) default `PENDING`
- `refund_status` enum(`NONE`,`REQUESTED`,`REFUNDED`,`PARTIAL`) default `NONE`
- `assigned_buyer_user_id` UUID FK -> users.id null
- `exception_status` enum(`NONE`,`TOGETHER_UNAVAILABLE`,`PRICE_BREAK`,`ZONE_UNAVAILABLE`,`QTY_UNAVAILABLE`,`FULFILLMENT_MISMATCH`,`DELIVERY_ISSUE`) default `NONE`
- `internal_notes` text null
- `created_at` timestamptz
- `updated_at` timestamptz

Index recommendations:
- index on `(fulfillment_status, created_at)`
- index on `(assigned_buyer_user_id, fulfillment_status)`
- index on `(event_date_id)`

## 6.8 Order Activity Log

### `order_activity`
- `id` UUID PK
- `order_id` UUID FK -> orders.id
- `actor_user_id` UUID FK -> users.id null
- `activity_type` text not null
- `details` jsonb null
- `created_at` timestamptz

## 6.9 Notifications

### `notifications`
- `id` UUID PK
- `order_id` UUID FK -> orders.id null
- `recipient_email` text not null
- `notification_type` text not null
- `delivery_status` enum(`PENDING`,`SENT`,`FAILED`) default `PENDING`
- `provider_message_id` text null
- `payload` jsonb null
- `created_at` timestamptz
- `updated_at` timestamptz

## 6.10 Daily Reports

### `daily_reports`
- `id` UUID PK
- `report_date` date not null
- `recipient_user_id` UUID FK -> users.id null
- `recipient_email` text not null
- `file_url` text null
- `status` enum(`PENDING`,`GENERATED`,`SENT`,`FAILED`) not null
- `created_at` timestamptz
- `updated_at` timestamptz

---

## 7. API Object Models

Use JSON over HTTPS. Prefer server-side mutations from the admin UI, but expose a clean internal API surface.

## 7.1 Parent Event Object
```json
{
  "id": "uuid",
  "slug": "hamilton-dr-phillips-center",
  "title": "Hamilton at Dr. Phillips Center",
  "venueName": "Dr. Phillips Center",
  "category": "Theater",
  "layoutTemplate": "hero-zones",
  "colors": {
    "primary": "#111111",
    "secondary": "#f5f5f5",
    "accent": "#d4af37",
    "textTheme": "light"
  },
  "heroImageUrl": "https://...",
  "galleryImages": ["https://..."],
  "marketingHeadline": "Premium access made simple",
  "subheadline": "Choose your date and seating zone",
  "eventDescription": "...",
  "disclosureBlock": "...",
  "isActive": true
}