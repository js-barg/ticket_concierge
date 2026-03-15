import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { getParentEventPageData } from '@/lib/events';
import { resolveEventTheme } from '@/lib/theme';
import { EventPageClient } from './EventPageClient';

type Props = { params: Promise<{ slug: string }> };

function logServerError(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[EventPage ${context}]`, message);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const data = await getParentEventPageData(slug);
    if (!data) return { title: 'Event not found' };
    return {
      title: `${data.title} | Ticket Concierge`,
      description: data.eventDescription ?? `${data.title} at ${data.venueName}`
    };
  } catch (err) {
    logServerError('generateMetadata', err);
    return { title: 'Event not found' };
  }
}

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof getParentEventPageData>>;
  try {
    data = await getParentEventPageData(slug);
  } catch (err) {
    logServerError('getParentEventPageData', err);
    throw err;
  }

  if (!data) notFound();

  const validDates = data.validDates;
  const defaultSelectedDateId =
    validDates.length === 1 ? validDates[0].id : validDates[0]?.id ?? null;

  const theme = resolveEventTheme({
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    accentColor: data.accentColor
  });

  const themeStyle = {
    '--event-primary': theme.primary,
    '--event-secondary': theme.secondary,
    '--event-accent': theme.accent,
    '--event-bg': theme.background,
    '--event-button': theme.button
  } as CSSProperties;

  return (
    <article
      className="space-y-8 event-theme"
      style={themeStyle}
    >
      {/* Hero */}
      <header className="space-y-4">
        {data.heroImageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden rounded-lg border border-[var(--event-secondary)] bg-[var(--event-primary)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.heroImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-400">{data.category}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            {data.title}
          </h1>
          <p className="mt-1 text-slate-400">{data.venueName}</p>
        </div>
        {data.marketingHeadline && (
          <p className="text-lg font-medium text-slate-200">{data.marketingHeadline}</p>
        )}
        {data.subheadline && (
          <p className="text-slate-400">{data.subheadline}</p>
        )}
        {data.eventDescription && (
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300">{data.eventDescription}</p>
          </div>
        )}
      </header>

      <EventPageClient
        data={data}
        defaultSelectedDateId={defaultSelectedDateId}
        theme={theme}
      />
    </article>
  );
}
