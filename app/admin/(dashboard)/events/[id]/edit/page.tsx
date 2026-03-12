import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ParentEventEditForm, type EditableParentEvent } from './ParentEventEditForm';

type Props = { params: Promise<{ id: string }> };

export default async function AdminParentEventEditPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();
  if (!requireAdminMutation(session?.user ?? null)) {
    notFound();
  }

  const event = await prisma.parentEvent.findUnique({ where: { id } });
  if (!event) notFound();

  const plainEvent: EditableParentEvent = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    venueName: event.venueName,
    category: event.category,
    marketingHeadline: event.marketingHeadline,
    subheadline: event.subheadline,
    eventDescription: event.eventDescription,
    layoutTemplate: event.layoutTemplate,
    primaryColor: event.primaryColor,
    secondaryColor: event.secondaryColor,
    accentColor: event.accentColor,
    textTheme: event.textTheme,
    heroImageUrl: event.heroImageUrl,
    mobileHeroImageUrl: event.mobileHeroImageUrl,
    disclosureBlock: event.disclosureBlock,
    defaultCutoffHours: event.defaultCutoffHours,
    defaultMarkupType: event.defaultMarkupType,
    defaultMarkupValue: event.defaultMarkupValue ? Number(event.defaultMarkupValue) : null,
    defaultMarginBuffer: event.defaultMarginBuffer ? Number(event.defaultMarginBuffer) : null,
    defaultServiceFeeType: event.defaultServiceFeeType,
    defaultServiceFeeValue: event.defaultServiceFeeValue ? Number(event.defaultServiceFeeValue) : null,
    isActive: event.isActive
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${id}`} className="text-slate-400 hover:text-white">
          ← {event.title}
        </Link>
        <h2 className="text-lg font-semibold text-white">Edit parent event</h2>
      </div>
      <ParentEventEditForm event={plainEvent} />
    </div>
  );
}
