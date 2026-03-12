/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MarkupType" AS ENUM ('PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "ServiceFeeType" AS ENUM ('PER_ORDER_FLAT', 'PER_TICKET_FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "EventVisibilityStatus" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "EventSaleStatus" AS ENUM ('DRAFT', 'LIVE', 'CUTOFF', 'SOLD_OUT', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('SEATING_MAP', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ZoneMarkupType" AS ENUM ('INHERIT', 'PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "ZoneServiceFeeType" AS ENUM ('INHERIT', 'PER_ORDER_FLAT', 'PER_TICKET_FLAT', 'PERCENT');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('ETICKET', 'PRINT', 'WILL_CALL');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'SQUARE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ACQUIRED', 'DELIVERED', 'EXCEPTION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'PICKUP_READY');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'REQUESTED', 'REFUNDED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('NONE', 'TOGETHER_UNAVAILABLE', 'PRICE_BREAK', 'ZONE_UNAVAILABLE', 'QTY_UNAVAILABLE', 'FULFILLMENT_MISMATCH', 'DELIVERY_ISSUE');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "DailyReportStatus" AS ENUM ('PENDING', 'GENERATED', 'SENT', 'FAILED');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "marketingHeadline" TEXT,
    "subheadline" TEXT,
    "eventDescription" TEXT,
    "layoutTemplate" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "textTheme" TEXT,
    "heroImageUrl" TEXT,
    "mobileHeroImageUrl" TEXT,
    "disclosureBlock" TEXT,
    "defaultCutoffHours" INTEGER,
    "defaultMarkupType" "MarkupType",
    "defaultMarkupValue" DECIMAL(10,2),
    "defaultMarginBuffer" DECIMAL(10,2),
    "defaultServiceFeeType" "ServiceFeeType",
    "defaultServiceFeeValue" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_event_images" (
    "id" TEXT NOT NULL,
    "parentEventId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_event_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_dates" (
    "id" TEXT NOT NULL,
    "parentEventId" TEXT NOT NULL,
    "performanceAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "visibilityStatus" "EventVisibilityStatus" NOT NULL DEFAULT 'VISIBLE',
    "saleStatus" "EventSaleStatus" NOT NULL DEFAULT 'DRAFT',
    "sellCutoffAt" TIMESTAMP(3) NOT NULL,
    "quantityCap" INTEGER,
    "assignedBuyerUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_date_assets" (
    "id" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "assetUrl" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_date_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "zoneName" TEXT NOT NULL,
    "customerDescription" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "mapRegionKey" TEXT,
    "sourceSectionMapping" JSONB,
    "sourceObservedCost" DECIMAL(10,2) NOT NULL,
    "markupType" "ZoneMarkupType" NOT NULL DEFAULT 'INHERIT',
    "markupValue" DECIMAL(10,2),
    "marginBufferValue" DECIMAL(10,2),
    "serviceFeeType" "ZoneServiceFeeType" NOT NULL DEFAULT 'INHERIT',
    "serviceFeeValue" DECIMAL(10,2),
    "publicPrice" DECIMAL(10,2),
    "availableQuantity" INTEGER NOT NULL,
    "minPurchaseQty" INTEGER NOT NULL DEFAULT 1,
    "maxPurchaseQty" INTEGER,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "parentEventId" TEXT NOT NULL,
    "eventDateId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "quantity" INTEGER NOT NULL,
    "seatsTogetherExpected" BOOLEAN NOT NULL DEFAULT true,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "sourceCostEstimateTotal" DECIMAL(10,2) NOT NULL,
    "markupAmountTotal" DECIMAL(10,2) NOT NULL,
    "marginBufferAmountTotal" DECIMAL(10,2) NOT NULL,
    "serviceFeeAmountTotal" DECIMAL(10,2) NOT NULL,
    "subtotalAmount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL,
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
    "assignedBuyerUserId" TEXT,
    "exceptionStatus" "ExceptionStatus" NOT NULL DEFAULT 'NONE',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_activity" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "activityType" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "recipientUserId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" "DailyReportStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parent_events_slug_key" ON "parent_events"("slug");

-- CreateIndex
CREATE INDEX "parent_event_images_parentEventId_idx" ON "parent_event_images"("parentEventId");

-- CreateIndex
CREATE INDEX "event_dates_parentEventId_performanceAt_idx" ON "event_dates"("parentEventId", "performanceAt");

-- CreateIndex
CREATE INDEX "event_dates_saleStatus_sellCutoffAt_idx" ON "event_dates"("saleStatus", "sellCutoffAt");

-- CreateIndex
CREATE INDEX "event_date_assets_eventDateId_idx" ON "event_date_assets"("eventDateId");

-- CreateIndex
CREATE INDEX "zones_eventDateId_isActive_displayOrder_idx" ON "zones"("eventDateId", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_fulfillmentStatus_createdAt_idx" ON "orders"("fulfillmentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "orders_assignedBuyerUserId_fulfillmentStatus_idx" ON "orders"("assignedBuyerUserId", "fulfillmentStatus");

-- CreateIndex
CREATE INDEX "orders_eventDateId_idx" ON "orders"("eventDateId");

-- CreateIndex
CREATE INDEX "order_activity_orderId_idx" ON "order_activity"("orderId");

-- CreateIndex
CREATE INDEX "notifications_orderId_idx" ON "notifications"("orderId");

-- CreateIndex
CREATE INDEX "daily_reports_reportDate_idx" ON "daily_reports"("reportDate");

-- AddForeignKey
ALTER TABLE "parent_event_images" ADD CONSTRAINT "parent_event_images_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "parent_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "parent_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_assignedBuyerUserId_fkey" FOREIGN KEY ("assignedBuyerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_date_assets" ADD CONSTRAINT "event_date_assets_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "parent_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedBuyerUserId_fkey" FOREIGN KEY ("assignedBuyerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_activity" ADD CONSTRAINT "order_activity_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_activity" ADD CONSTRAINT "order_activity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
