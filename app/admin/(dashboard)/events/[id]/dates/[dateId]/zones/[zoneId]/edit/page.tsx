import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ZoneEditForm, type EditableZone } from './ZoneEditForm';
import { deleteZoneForm } from '@/lib/actions/admin-events';

type Props = { params: Promise<{ id: string; dateId: string; zoneId: string }> };

export default async function AdminZoneEditPage({ params }: Props) {
  const { id: eventId, dateId, zoneId } = await params;
  const session = await getServerSession();
  const canMutate = requireAdminMutation(session?.user ?? null);

  const event = await prisma.parentEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true }
  });
  const eventDate = await prisma.eventDate.findUnique({
    where: { id: dateId, parentEventId: eventId }
  });
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId, eventDateId: dateId }
  });

  if (!event || !eventDate || !zone) notFound();

  const plainZone: EditableZone = {
    id: zone.id,
    eventDateId: zone.eventDateId,
    zoneName: zone.zoneName,
    customerDescription: zone.customerDescription,
    displayOrder: zone.displayOrder,
    mapRegionKey: zone.mapRegionKey,
    sourceSectionMapping: zone.sourceSectionMapping ?? null,
    sourceObservedCost: Number(zone.sourceObservedCost),
    markupType: zone.markupType,
    markupValue: zone.markupValue ? Number(zone.markupValue) : null,
    marginBufferValue: zone.marginBufferValue ? Number(zone.marginBufferValue) : null,
    serviceFeeType: zone.serviceFeeType,
    serviceFeeValue: zone.serviceFeeValue ? Number(zone.serviceFeeValue) : null,
    publicPrice: zone.publicPrice ? Number(zone.publicPrice) : null,
    availableQuantity: zone.availableQuantity,
    minPurchaseQty: zone.minPurchaseQty,
    maxPurchaseQty: zone.maxPurchaseQty,
    fulfillmentType: zone.fulfillmentType,
    isActive: zone.isActive,
    notes: zone.notes
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${eventId}/dates/${dateId}`} className="text-slate-400 hover:text-white">
          ← {new Date(eventDate.performanceAt).toLocaleString()}
        </Link>
        <h2 className="text-lg font-semibold text-white">Edit zone: {zone.zoneName}</h2>
        {canMutate && (
          <form action={deleteZoneForm} className="inline">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="dateId" value={dateId} />
            <input type="hidden" name="zoneId" value={zoneId} />
            <button type="submit" className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
              Delete zone
            </button>
          </form>
        )}
      </div>
      {canMutate ? (
        <ZoneEditForm eventId={eventId} dateId={dateId} zoneId={zoneId} zone={plainZone} />
      ) : (
        <dl className="grid gap-2 text-sm">
          <div><dt className="text-slate-500">Zone name</dt><dd className="text-white">{zone.zoneName}</dd></div>
          <div><dt className="text-slate-500">Public price</dt><dd className="text-white">{zone.publicPrice != null ? `$${Number(zone.publicPrice).toFixed(2)}` : '—'}</dd></div>
          <div><dt className="text-slate-500">Available qty</dt><dd className="text-white">{zone.availableQuantity}</dd></div>
          <div><dt className="text-slate-500">Fulfillment</dt><dd className="text-white">{zone.fulfillmentType}</dd></div>
        </dl>
      )}
    </div>
  );
}
