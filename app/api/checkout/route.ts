import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateQuote } from '@/lib/quote';
import { createCheckoutSession } from '@/lib/stripe';

const CheckoutSchema = z.object({
  eventDateId: z.string().min(1),
  zoneId: z.string().min(1),
  quantity: z.number().int().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { eventDateId, zoneId, quantity, customerName, customerEmail, customerPhone } =
      parsed.data;

    const quote = await generateQuote({ eventDateId, zoneId, quantity });

    const appBaseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
    const currency = 'usd';

    const session = await createCheckoutSession({
      amountTotalCents: Math.round(quote.pricing.total * 100),
      perTicketAmountCents: Math.round(quote.pricing.perTicketPublicPrice * 100),
      quantity: quote.quantity,
      currency,
      eventTitle: quote.eventTitle,
      venueName: quote.venueName,
      zoneName: quote.zoneName,
      customerName,
      customerEmail,
      customerPhone,
      successUrl: `${appBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appBaseUrl}/checkout/cancel`,
      branding: {
        displayName: quote.eventTitle,
        backgroundColor: quote.theme.background,
        buttonColor: quote.theme.button
      },
      metadata: {
        parentEventId: quote.parentEventId,
        eventDateId,
        zoneId,
        quantity: String(quantity),
        fulfillmentType: quote.fulfillmentType,
        seatsTogetherExpected: quote.seatsTogetherExpected ? 'true' : 'false',
        sourceCostTotal: String(quote.pricing.sourceCostTotal),
        markupAmountTotal: String(quote.pricing.markupAmountTotal),
        marginBufferAmountTotal: String(quote.pricing.marginBufferAmountTotal),
        serviceFeeAmountTotal: String(quote.pricing.serviceFeeAmountTotal),
        subtotal: String(quote.pricing.subtotal),
        taxAmount: String(quote.pricing.taxAmount),
        total: String(quote.pricing.total)
      }
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error('Checkout error', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unable to create checkout' },
      { status: 400 }
    );
  }
}

