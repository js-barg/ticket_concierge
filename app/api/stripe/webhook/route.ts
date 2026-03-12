import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe';
import { createOrderFromCheckoutSession } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new NextResponse('Missing Stripe signature', { status: 400 });
  }

  const webhookSecret = getStripeWebhookSecret();

  const buf = Buffer.from(await request.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await createOrderFromCheckoutSession(session);
      }
    }
  } catch (err) {
    console.error('Error handling Stripe webhook', err);
    // Return 200 so Stripe does not retry indefinitely if we consider this non-recoverable
    return new NextResponse('Webhook handling error', { status: 200 });
  }

  return new NextResponse('OK', { status: 200 });
}

