'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ParentEventPageData, ValidEventDate, ZoneOption } from '../../../lib/events';
import type { ResolvedTheme } from '@/lib/theme';

function formatPerformanceAt(iso: string, tz: string): string {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function EventPageClient({
  data,
  defaultSelectedDateId,
  theme
}: {
  data: ParentEventPageData;
  defaultSelectedDateId: string | null;
  theme: ResolvedTheme;
}) {
  const [selectedDateId, setSelectedDateId] = useState<string | null>(defaultSelectedDateId);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [quote, setQuote] = useState<{
    total: number;
    perTicket: number;
    serviceFee: number;
    subtotal: number;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [seatingMapError, setSeatingMapError] = useState(false);

  const selectedDate: ValidEventDate | undefined = useMemo(
    () => data.validDates.find((d) => d.id === selectedDateId) ?? data.validDates[0] ?? undefined,
    [data.validDates, selectedDateId]
  );

  useEffect(() => {
    setSeatingMapError(false);
    setSelectedZoneId(null);
    setQuote(null);
    setQuoteError(null);
  }, [selectedDateId]);

  useEffect(() => {
    if (!selectedDate || !selectedZoneId || quantity <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    const zone = selectedDate.zones.find((z) => z.id === selectedZoneId);
    if (!zone) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const controller = new AbortController();
    const fetchQuote = async () => {
      try {
        setQuoteLoading(true);
        setQuoteError(null);
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventDateId: selectedDate.id,
            zoneId: selectedZoneId,
            quantity
          }),
          signal: controller.signal
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setQuote(null);
          setQuoteError(json.error ?? 'Unable to calculate price.');
          return;
        }
        const q = json.quote as {
          pricing: {
            perTicketPublicPrice: number;
            serviceFeeAmountTotal: number;
            subtotal: number;
            total: number;
          };
        };
        setQuote({
          perTicket: q.pricing.perTicketPublicPrice,
          serviceFee: q.pricing.serviceFeeAmountTotal,
          subtotal: q.pricing.subtotal,
          total: q.pricing.total
        });
      } catch (err) {
        if ((err as any).name === 'AbortError') return;
        setQuote(null);
        setQuoteError('Unable to calculate price.');
      } finally {
        setQuoteLoading(false);
      }
    };
    void fetchQuote();
    return () => controller.abort();
  }, [selectedDate, selectedZoneId, quantity]);

  async function handleCheckout() {
    if (!selectedDate || !selectedZoneId || !quote) return;
    const nameInput = document.getElementById('checkout-name') as HTMLInputElement | null;
    const emailInput = document.getElementById('checkout-email') as HTMLInputElement | null;
    const phoneInput = document.getElementById('checkout-phone') as HTMLInputElement | null;

    const customerName = nameInput?.value?.trim() ?? '';
    const customerEmail = emailInput?.value?.trim() ?? '';
    const customerPhone = phoneInput?.value?.trim();

    if (!customerName || !customerEmail) {
      setQuoteError('Please enter your name and email to continue.');
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDateId: selectedDate.id,
          zoneId: selectedZoneId,
          quantity,
          customerName,
          customerEmail,
          customerPhone
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.url) {
        setQuoteError(json.error ?? 'Unable to start checkout.');
        return;
      }
      window.location.href = json.url as string;
    } catch (err) {
      setQuoteError('Unable to start checkout.');
    } finally {
      setQuoteLoading(false);
    }
  }

  if (data.validDates.length === 0) {
    return (
      <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-6 text-center">
        <p className="font-medium text-amber-200">No dates currently available</p>
        <p className="mt-1 text-sm text-slate-400">
          There are no upcoming performance dates on sale at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Date selector */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
          Select date
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.validDates.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDateId(d.id)}
              className={`rounded-lg border px-4 py-2 text-left text-sm transition-colors ${
                selectedDateId === d.id
                  ? 'border-[var(--event-accent)] bg-[var(--event-secondary)] text-white'
                  : 'border-[var(--event-secondary)] bg-[var(--event-primary)]/80 text-slate-300 hover:bg-[var(--event-secondary)]/80'
              }`}
            >
              {formatPerformanceAt(d.performanceAt, d.timezone)}
            </button>
          ))}
        </div>
      </section>

      {/* Seating map for selected date — graceful fallback when image fails or is missing */}
      {selectedDate?.seatingMapUrl && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
            Seating map
          </h2>
          <div className="overflow-hidden rounded-lg border border-[var(--event-secondary)] bg-[var(--event-primary)]">
            {seatingMapError ? (
              <div className="flex min-h-[120px] items-center justify-center px-4 py-8 text-center">
                <p className="text-sm text-slate-500">Seating map image unavailable</p>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedDate.seatingMapUrl}
                alt="Seating map"
                className="w-full object-contain"
                onError={() => setSeatingMapError(true)}
              />
            )}
          </div>
        </section>
      )}

      {/* Zones for selected date */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
          Seating zones
        </h2>
        <div className="space-y-3">
          {selectedDate?.zones.map((z) => (
            <div
              key={z.id}
              className={`flex flex-col gap-1 rounded-lg border p-4 transition-colors ${
                selectedZoneId === z.id
                  ? 'border-[var(--event-accent)] bg-[var(--event-secondary)]'
                  : 'border-[var(--event-secondary)] bg-[var(--event-primary)]/50 hover:bg-[var(--event-secondary)]/30'
              }`}
              onClick={() => setSelectedZoneId(z.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white">{z.zoneName}</h3>
                  {z.customerDescription && (
                    <p className="mt-0.5 text-sm text-slate-400">{z.customerDescription}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {z.publicPrice != null ? (
                    <span className="text-lg font-semibold text-white">
                      ${z.publicPrice.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-500">Price TBD</span>
                  )}
                  <span className="ml-1 text-sm text-slate-400">/ ticket</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {z.availableQuantity} available · Min {z.minPurchaseQty}
                {z.maxPurchaseQty != null ? ` · Max ${z.maxPurchaseQty}` : ''} · {z.fulfillmentType}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote and checkout */}
      {selectedDate && selectedZoneId && (
        <section className="space-y-4 rounded-lg border border-[var(--event-secondary)] bg-[var(--event-primary)]/60 p-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Your selection
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-1 block text-sm font-medium text-slate-300"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 rounded border border-[var(--event-secondary)] bg-[var(--event-primary)] px-2 py-1 text-sm text-white focus:border-[var(--event-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--event-accent)]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Contact details</label>
                <input
                  id="checkout-name"
                  type="text"
                  placeholder="Full name"
                  className="w-full rounded border border-[var(--event-secondary)] bg-[var(--event-primary)] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[var(--event-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--event-accent)]"
                />
                <input
                  id="checkout-email"
                  type="email"
                  placeholder="Email"
                  className="w-full rounded border border-[var(--event-secondary)] bg-[var(--event-primary)] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[var(--event-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--event-accent)]"
                />
                <input
                  id="checkout-phone"
                  type="tel"
                  placeholder="Phone (optional)"
                  className="w-full rounded border border-[var(--event-secondary)] bg-[var(--event-primary)] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[var(--event-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--event-accent)]"
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <h3 className="font-medium text-slate-200">Price summary</h3>
              {quote && (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span>
                      Tickets ({quantity} × ${quote.perTicket.toFixed(2)})
                    </span>
                    <span>${quote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Service fees</span>
                    <span>${quote.serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--event-secondary)] pt-2 text-slate-100">
                    <span>Total</span>
                    <span className="font-semibold">${quote.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500">Tax is currently 0 for this quote.</p>
                </>
              )}
              {!quote && !quoteError && (
                <p className="text-xs text-slate-500">
                  Select a quantity to see live pricing for this zone.
                </p>
              )}
              {quoteError && <p className="text-xs text-amber-400">{quoteError}</p>}
              <button
                type="button"
                disabled={!quote || quoteLoading}
                onClick={handleCheckout}
                className="mt-3 inline-flex w-full items-center justify-center rounded px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: theme.button }}
              >
                {quoteLoading ? 'Processing…' : 'Continue to checkout'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Disclosure */}
      {data.disclosureBlock && (
        <section className="rounded-lg border border-[var(--event-secondary)] bg-[var(--event-primary)]/40 p-4">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
            Important information
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-400">{data.disclosureBlock}</p>
        </section>
      )}
    </div>
  );
}
