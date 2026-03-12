import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteParentEventForm } from '@/lib/actions/admin-events';
import { StatusBadge } from '@/admin-components/StatusBadge';

type Props = { params: Promise<{ id: string }> };

export default async function AdminParentEventDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();
  const canMutate = requireAdminMutation(session?.user ?? null);

  const event = await prisma.parentEvent.findUnique({
    where: { id },
    include: {
      eventDates: { orderBy: { performanceAt: 'asc' }, include: { assignedBuyer: { select: { name: true, email: true } } } }
    }
  });

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events" className="text-slate-400 hover:text-white">
          ← Parent events
        </Link>
        <h2 className="text-lg font-semibold text-white">{event.title}</h2>
        <StatusBadge status={event.isActive ? 'Active' : 'Inactive'} variant={event.isActive ? 'success' : 'muted'} />
        {canMutate && (
          <>
            <Link
              href={`/admin/events/${id}/edit`}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-500"
            >
              Edit
            </Link>
            <form action={deleteParentEventForm} className="inline">
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
                Delete
              </button>
            </form>
          </>
        )}
      </div>

      <dl className="grid gap-2 text-sm">
        <div><dt className="text-slate-500">Slug</dt><dd className="text-white">{event.slug}</dd></div>
        <div><dt className="text-slate-500">Venue</dt><dd className="text-white">{event.venueName}</dd></div>
        <div><dt className="text-slate-500">Category</dt><dd className="text-white">{event.category}</dd></div>
      </dl>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-white">Event dates</h3>
          {canMutate && (
            <Link
              href={`/admin/events/${id}/dates/new`}
              className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-500"
            >
              Add date
            </Link>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 font-medium text-slate-300">Performance</th>
                <th className="px-4 py-2 font-medium text-slate-300">Timezone</th>
                <th className="px-4 py-2 font-medium text-slate-300">Visibility</th>
                <th className="px-4 py-2 font-medium text-slate-300">Sale status</th>
                <th className="px-4 py-2 font-medium text-slate-300">Assigned buyer</th>
                <th className="px-4 py-2 font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {event.eventDates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                    No event dates. {canMutate && 'Add a date to manage zones.'}
                  </td>
                </tr>
              ) : (
                event.eventDates.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-white">
                      {new Date(d.performanceAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{d.timezone}</td>
                    <td className="px-4 py-2"><StatusBadge status={d.visibilityStatus} /></td>
                    <td className="px-4 py-2"><StatusBadge status={d.saleStatus} variant="warning" /></td>
                    <td className="px-4 py-2 text-slate-400">{d.assignedBuyer?.name ?? '—'}</td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/events/${id}/dates/${d.id}`} className="text-slate-400 hover:text-white">View</Link>
                      {canMutate && (
                        <>
                          {' · '}
                          <Link href={`/admin/events/${id}/dates/${d.id}/edit`} className="text-slate-400 hover:text-white">Edit</Link>
                        </>
                      )}
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
