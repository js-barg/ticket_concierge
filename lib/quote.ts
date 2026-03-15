import { prisma } from './db';
import { calculatePricing, type PricingBreakdown } from './pricing';
import { validateQuantity } from './quantity';
import { resolveEventTheme } from './theme';

export type QuoteRequest = {
  eventDateId: string;
  zoneId: string;
  quantity: number;
};

export type QuoteResult = {
  parentEventId: string;
  eventTitle: string;
  venueName: string;
  performanceAt: string;
  timezone: string;
  zoneName: string;
  quantity: number;
  fulfillmentType: string;
  seatsTogetherExpected: boolean;
  pricing: PricingBreakdown & {
    perTicketPublicPrice: number;
  };
  /** Theme for UI and Stripe Checkout branding */
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    button: string;
  };
};

export async function generateQuote(req: QuoteRequest): Promise<QuoteResult> {
  const { eventDateId, zoneId, quantity } = req;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive integer.');
  }

  const eventDate = await prisma.eventDate.findUnique({
    where: { id: eventDateId },
    include: {
      parentEvent: true,
      zones: { where: { id: zoneId, isActive: true } }
    }
  });

  if (!eventDate || !eventDate.parentEvent) {
    throw new Error('Event date not found.');
  }
  const parent = eventDate.parentEvent;
  const zone = eventDate.zones[0];
  if (!zone) {
    throw new Error('Zone not found for this event date.');
  }

  // Event date validity (same rules as public visibility, plus sale_status LIVE)
  const now = new Date();
  if (
    eventDate.visibilityStatus !== 'VISIBLE' ||
    eventDate.saleStatus !== 'LIVE' ||
    now >= eventDate.sellCutoffAt ||
    now >= eventDate.performanceAt
  ) {
    throw new Error('This event date is not currently available for purchase.');
  }

  // Quantity validation
  const qv = validateQuantity(quantity, {
    eventDateQuantityCap: eventDate.quantityCap ?? null,
    zoneAvailableQuantity: zone.availableQuantity,
    zoneMinPurchaseQty: zone.minPurchaseQty,
    zoneMaxPurchaseQty: zone.maxPurchaseQty ?? null
  });
  if (!qv.ok) {
    throw new Error(qv.error);
  }

  const sourceObservedCost = Number(zone.sourceObservedCost);

  const pricing = calculatePricing({
    sourceObservedCost,
    quantity,
    zoneMarkupType: zone.markupType,
    zoneMarkupValue: zone.markupValue != null ? Number(zone.markupValue) : null,
    zoneMarginBufferValue: zone.marginBufferValue != null ? Number(zone.marginBufferValue) : null,
    zoneServiceFeeType: zone.serviceFeeType,
    zoneServiceFeeValue: zone.serviceFeeValue != null ? Number(zone.serviceFeeValue) : null,
    parentMarkupType: parent.defaultMarkupType ?? null,
    parentMarkupValue: parent.defaultMarkupValue != null ? Number(parent.defaultMarkupValue) : null,
    parentMarginBuffer: parent.defaultMarginBuffer != null ? Number(parent.defaultMarginBuffer) : null,
    parentServiceFeeType: parent.defaultServiceFeeType ?? null,
    parentServiceFeeValue:
      parent.defaultServiceFeeValue != null ? Number(parent.defaultServiceFeeValue) : null
  });

  const theme = resolveEventTheme({
    primaryColor: parent.primaryColor,
    secondaryColor: parent.secondaryColor,
    accentColor: parent.accentColor
  });

  return {
    parentEventId: parent.id,
    eventTitle: parent.title,
    venueName: parent.venueName,
    performanceAt: eventDate.performanceAt.toISOString(),
    timezone: eventDate.timezone,
    zoneName: zone.zoneName,
    quantity,
    fulfillmentType: zone.fulfillmentType,
    seatsTogetherExpected: quantity > 1,
    pricing,
    theme
  };
}

