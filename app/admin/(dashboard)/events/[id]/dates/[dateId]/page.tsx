import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatusBadge } from '@/admin-components/StatusBadge';
import { deleteEventDateForm } from '@/lib/actions/admin-events';

type Props = { params: Promise<{ id: string; dateId: string }> };

export default async function AdminEventDateDetailPage({ params }: Props) {
  const { id: eventId, dateId } = await params;
  const session = await getServerSession();
  const canMutate = requireAdminMutation(session?.user ?? null);

  const event = await prisma.parentEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true }
  });
  const eventDate = await prisma.eventDate.findUnique({
    where: { id: dateId, parentEventId: eventId },
    include: {
      assignedBuyer: { select: { name: true, email: true } },
      zones: { orderBy: { displayOrder: 'asc' } }
    }
  });

  if (!event || !eventDate) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${eventId}`} className="text-slate-400 hover:text-white">
          ← {event.title}
        </Link>
        <h2 className="text-lg font-semibold text-white">
          {new Date(eventDate.performanceAt).toLocaleString()} ({eventDate.timezone})
        </h2>
        <StatusBadge status={eventDate.visibilityStatus} />
        <StatusBadge status={eventDate.saleStatus} variant="warning" />
        {canMutate && (
          <>
            <Link
              href={`/admin/events/${eventId}/dates/${dateId}/edit`}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-500"
            >
              Edit date
            </Link>
            <form action={deleteEventDateForm} className="inline">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="dateId" value={dateId} />
              <button type="submit" className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
                Delete date
              </button>
            </form>
          </>
        )}
      </div>

      <dl className="grid gap-2 text-sm">
        <div><dt className="text-slate-500">Sell cutoff</dt><dd className="text-white">{new Date(eventDate.sellCutoffAt).toLocaleString()}</dd></div>
        <div><dt className="text-slate-500">Quantity cap</dt><dd className="text-white">{eventDate.quantityCap ?? '—'}</dd></div>
        <div><dt className="text-slate-500">Assigned buyer</dt><dd className="text-white">{eventDate.assignedBuyer?.name ?? '—'}</dd></div>
        {eventDate.notes && <div><dt className="text-slate-500">Notes</dt><dd className="text-white">{eventDate.notes}</dd></div>}
      </dl>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-white">Zones</h3>
          {canMutate && (
            <Link
              href={`/admin/events/${eventId}/dates/${dateId}/zones/new`}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-500"
            >
              Add zone
            </Link>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-300">Zone</th>
                <th className="px-4 py-2 font-medium text-slate-300">Price</th>
                <th className="px-4 py-2 font-medium text-slate-300">Qty</th>
                <th className="px-4 py-2 font-medium text-slate-300">Fulfillment</th>
                <th className="px-4 py-2 font-medium text-slate-300">Status</th>
                <th className="px-4 py-2 font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {eventDate.zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                    No zones. {canMutate && 'Add a zone for this date.'}
                  </td>
                </tr>
              ) : (
                eventDate.zones.map((z) => (
                  <tr key={z.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-medium text-white">{z.zoneName}</td>
                    <td className="px-4 py-2 text-slate-400">{z.publicPrice != null ? `$${Number(z.publicPrice).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-2 text-slate-400">{z.availableQuantity}</td>
                    <td className="px-4 py-2 text-slate-400">{z.fulfillmentType}</td>
                    <td className="px-4 py-2"><StatusBadge status={z.isActive ? 'Active' : 'Inactive'} variant={z.isActive ? 'success' : 'muted'} /></td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/events/${eventId}/dates/${dateId}/zones/${z.id}/edit`} className="text-slate-400 hover:text-white">
                        {canMutate ? 'Edit' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
