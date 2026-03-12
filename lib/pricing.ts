import type { MarkupType, ServiceFeeType, ZoneMarkupType, ZoneServiceFeeType } from '@prisma/client';

export type PricingContext = {
  sourceObservedCost: number; // per ticket
  quantity: number;

  // Zone-level pricing
  zoneMarkupType: ZoneMarkupType;
  zoneMarkupValue: number | null;
  zoneMarginBufferValue: number | null;
  zoneServiceFeeType: ZoneServiceFeeType;
  zoneServiceFeeValue: number | null;

  // Parent event defaults
  parentMarkupType: MarkupType | null;
  parentMarkupValue: number | null;
  parentMarginBuffer: number | null;
  parentServiceFeeType: ServiceFeeType | null;
  parentServiceFeeValue: number | null;
};

export type PricingBreakdown = {
  sourceCostTotal: number;
  markupAmountTotal: number;
  marginBufferAmountTotal: number;
  perTicketPublicPrice: number;
  serviceFeeAmountTotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
};

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function effectiveMarkup(ctx: PricingContext): { type: 'PERCENT' | 'FLAT' | null; value: number } {
  if (ctx.zoneMarkupType === 'INHERIT') {
    if (!ctx.parentMarkupType || ctx.parentMarkupValue == null) {
      return { type: null, value: 0 };
    }
    return { type: ctx.parentMarkupType, value: ctx.parentMarkupValue };
  }

  if (ctx.zoneMarkupValue == null) {
    return { type: null, value: 0 };
  }

  if (ctx.zoneMarkupType === 'PERCENT' || ctx.zoneMarkupType === 'FLAT') {
    return { type: ctx.zoneMarkupType, value: ctx.zoneMarkupValue };
  }

  return { type: null, value: 0 };
}

function effectiveServiceFee(
  ctx: PricingContext
): { type: 'PER_ORDER_FLAT' | 'PER_TICKET_FLAT' | 'PERCENT' | null; value: number } {
  if (ctx.zoneServiceFeeType === 'INHERIT') {
    if (!ctx.parentServiceFeeType || ctx.parentServiceFeeValue == null) {
      return { type: null, value: 0 };
    }
    return { type: ctx.parentServiceFeeType, value: ctx.parentServiceFeeValue };
  }

  if (ctx.zoneServiceFeeValue == null) {
    return { type: null, value: 0 };
  }

  if (
    ctx.zoneServiceFeeType === 'PER_ORDER_FLAT' ||
    ctx.zoneServiceFeeType === 'PER_TICKET_FLAT' ||
    ctx.zoneServiceFeeType === 'PERCENT'
  ) {
    return { type: ctx.zoneServiceFeeType, value: ctx.zoneServiceFeeValue };
  }

  return { type: null, value: 0 };
}

function effectiveMarginBuffer(ctx: PricingContext): number {
  if (ctx.zoneMarginBufferValue != null) return ctx.zoneMarginBufferValue;
  if (ctx.parentMarginBuffer != null) return ctx.parentMarginBuffer;
  return 0;
}

export function calculatePricing(ctx: PricingContext): PricingBreakdown {
  const quantity = ctx.quantity;
  const sourcePerTicket = ctx.sourceObservedCost;
  const markup = effectiveMarkup(ctx);
  const marginBufferPerTicket = effectiveMarginBuffer(ctx);

  let markupPerTicket = 0;
  if (markup.type === 'PERCENT') {
    markupPerTicket = (markup.value / 100) * sourcePerTicket;
  } else if (markup.type === 'FLAT') {
    markupPerTicket = markup.value;
  }

  const perTicketPublicPrice = roundToCents(sourcePerTicket + markupPerTicket + marginBufferPerTicket);

  const sourceCostTotal = roundToCents(sourcePerTicket * quantity);
  const markupAmountTotal = roundToCents(markupPerTicket * quantity);
  const marginBufferAmountTotal = roundToCents(marginBufferPerTicket * quantity);

  const subtotal = roundToCents(perTicketPublicPrice * quantity);

  const serviceFee = effectiveServiceFee(ctx);
  let serviceFeeTotal = 0;
  if (serviceFee.type === 'PER_ORDER_FLAT') {
    serviceFeeTotal = serviceFee.value;
  } else if (serviceFee.type === 'PER_TICKET_FLAT') {
    serviceFeeTotal = serviceFee.value * quantity;
  } else if (serviceFee.type === 'PERCENT') {
    serviceFeeTotal = (serviceFee.value / 100) * subtotal;
  }
  serviceFeeTotal = roundToCents(serviceFeeTotal);

  const taxAmount = 0;
  const total = roundToCents(subtotal + serviceFeeTotal + taxAmount);

  return {
    sourceCostTotal,
    markupAmountTotal,
    marginBufferAmountTotal,
    perTicketPublicPrice,
    serviceFeeAmountTotal: serviceFeeTotal,
    subtotal,
    taxAmount,
    total
  };
}

