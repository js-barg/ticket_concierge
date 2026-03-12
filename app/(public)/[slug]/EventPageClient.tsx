'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ParentEventPageData, ValidEventDate } from '../../../lib/events';

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
  defaultSelectedDateId
}: {
  data: ParentEventPageData;
  defaultSelectedDateId: string | null;
}) {
  const [selectedDateId, setSelectedDateId] = useState<string | null>(defaultSelectedDateId);
  const [seatingMapError, setSeatingMapError] = useState(false);

  const selectedDate: ValidEventDate | undefined = useMemo(
    () => data.validDates.find((d) => d.id === selectedDateId) ?? data.validDates[0] ?? undefined,
    [data.validDates, selectedDateId]
  );

  useEffect(() => {
    setSeatingMapError(false);
  }, [selectedDateId]);

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
                  ? 'border-slate-500 bg-slate-700 text-white'
                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
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
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
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
              className="flex flex-col gap-1 rounded-lg border border-slate-700 bg-slate-800/50 p-4"
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

      {/* Disclosure */}
      {data.disclosureBlock && (
        <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
            Important information
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-400">{data.disclosureBlock}</p>
        </section>
      )}
    </div>
  );
}
