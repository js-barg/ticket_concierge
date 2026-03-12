import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeClient = new Stripe(secret, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return secret;
}

export type CreateCheckoutSessionInput = {
  amountTotalCents: number;
  perTicketAmountCents: number;
  quantity: number;
  currency: string;
  eventTitle: string;
  venueName: string;
  zoneName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
};

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    phone_number_collection: { enabled: true },
    line_items: [
      {
        quantity: input.quantity,
        price_data: {
          currency: input.currency,
          unit_amount: input.perTicketAmountCents,
          product_data: {
            name: `${input.eventTitle} – ${input.zoneName}`,
            description: `${input.venueName}`
          }
        }
      }
    ],
    metadata: {
      customerName: input.customerName,
      customerPhone: input.customerPhone ?? '',
      ...input.metadata
    }
  });

  return session;
}

