import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateQuote } from '@/lib/quote';

const QuoteSchema = z.object({
  eventDateId: z.string().min(1),
  zoneId: z.string().min(1),
  quantity: z.number().int().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = QuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }
    const quote = await generateQuote(parsed.data);
    return NextResponse.json({ ok: true, quote });
  } catch (err) {
    console.error('Quote error', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unable to generate quote' },
      { status: 400 }
    );
  }
}

