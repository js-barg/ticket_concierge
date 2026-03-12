import { notFound } from 'next/navigation';
import { getParentEventPageData } from '../../../lib/events';
import { EventPageClient } from './EventPageClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getParentEventPageData(slug);
  if (!data) return { title: 'Event not found' };
  return {
    title: `${data.title} | Ticket Concierge`,
    description: data.eventDescription ?? `${data.title} at ${data.venueName}`
  };
}

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params;
  const data = await getParentEventPageData(slug);

  if (!data) notFound();

  const validDates = data.validDates;
  const defaultSelectedDateId =
    validDates.length === 1 ? validDates[0].id : validDates[0]?.id ?? null;

  return (
    <article className="space-y-8">
      {/* Hero */}
      <header className="space-y-4">
        {data.heroImageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
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

      <EventPageClient data={data} defaultSelectedDateId={defaultSelectedDateId} />
    </article>
  );
}
