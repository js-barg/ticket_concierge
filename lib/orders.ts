import type Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from './db';

// Deterministic order number per Stripe session: ensures webhook idempotency via unique constraint.
export function generateOrderNumber(stripeSessionId?: string): string {
  if (!stripeSessionId) {
    const ts = Date.now().toString(36).toUpperCase();
    return `TC-${ts}-LOCAL`;
  }
  // Remove common prefix and compress into a short, deterministic token.
  const cleaned = stripeSessionId.replace('cs_test_', '').replace('cs_live_', '').toUpperCase();
  const token = cleaned.slice(-10); // last 10 chars are enough for uniqueness
  return `TC-${token}`;
}

export async function createOrderFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  const meta = session.metadata ?? {};
  const {
    parentEventId,
    eventDateId,
    zoneId,
    quantity,
    fulfillmentType,
    seatsTogetherExpected,
    sourceCostTotal,
    markupAmountTotal,
    marginBufferAmountTotal,
    serviceFeeAmountTotal,
    subtotal,
    taxAmount,
    total
  } = meta;

  if (!parentEventId || !eventDateId || !zoneId || !quantity || !total) {
    throw new Error('Missing required metadata on checkout session.');
  }

  const qty = Number(quantity);

  const existingActivity = await prisma.orderActivity.findFirst({
    where: {
      activityType: 'ORDER_CREATED',
      details: {
        path: ['stripeSessionId'],
        equals: session.id
      }
    }
  });
  if (existingActivity) {
    return;
  }

  const eventDate = await prisma.eventDate.findUnique({
    where: { id: eventDateId },
    include: { parentEvent: true }
  });
  if (!eventDate || !eventDate.parentEvent) {
    throw new Error('Event date or parent event not found when creating order.');
  }

  const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
  if (!zone) {
    throw new Error('Zone not found when creating order.');
  }

  const amountTotalCents = session.amount_total ?? 0;
  const amountTotal = amountTotalCents / 100;

  const subtotalAmount = subtotal ? Number(subtotal) : amountTotal;
  const tax = taxAmount ? Number(taxAmount) : 0;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(session.id),
      parentEventId,
      eventDateId,
      zoneId,
      customerName: (meta.customerName as string) || (session.customer_details?.name ?? ''),
      customerEmail:
        (session.customer_details?.email as string) ||
        (typeof session.customer_email === 'string' ? session.customer_email : ''),
      customerPhone:
        (meta.customerPhone as string) || (session.customer_details?.phone as string | undefined),
      quantity: qty,
      seatsTogetherExpected: seatsTogetherExpected === 'true' || qty > 1,
      fulfillmentType: (fulfillmentType as any) || zone.fulfillmentType,
      sourceCostEstimateTotal: sourceCostTotal ? new Prisma.Decimal(sourceCostTotal) : zone.sourceObservedCost.mul(qty),
      markupAmountTotal: markupAmountTotal ? new Prisma.Decimal(markupAmountTotal) : new Prisma.Decimal(0),
      marginBufferAmountTotal: marginBufferAmountTotal
        ? new Prisma.Decimal(marginBufferAmountTotal)
        : new Prisma.Decimal(0),
      serviceFeeAmountTotal: serviceFeeAmountTotal
        ? new Prisma.Decimal(serviceFeeAmountTotal)
        : new Prisma.Decimal(amountTotal - subtotalAmount - tax),
      subtotalAmount: new Prisma.Decimal(subtotalAmount),
      taxAmount: new Prisma.Decimal(tax),
      totalAmount: new Prisma.Decimal(total ? Number(total) : amountTotal),
      paymentProvider: 'STRIPE',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NEW',
      deliveryStatus: 'PENDING',
      refundStatus: 'NONE',
      assignedBuyerUserId: eventDate.assignedBuyerUserId ?? null,
      exceptionStatus: 'NONE'
    }
  });

  await prisma.orderActivity.create({
    data: {
      orderId: order.id,
      actorUserId: null,
      activityType: 'ORDER_CREATED',
      details: {
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        amountTotal: amountTotalCents
      } as any
    }
  });
}

