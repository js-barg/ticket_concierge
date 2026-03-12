import Link from 'next/link';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatusBadge } from '@/admin-components/StatusBadge';

export default async function AdminEventsListPage() {
  const session = await getServerSession();
  const canMutate = requireAdminMutation(session?.user ?? null);

  const events = await prisma.parentEvent.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { eventDates: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Parent Events</h2>
        {canMutate && (
          <Link
            href="/admin/events/new"
            className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500"
          >
            New parent event
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-300">Title</th>
              <th className="px-4 py-3 font-medium text-slate-300">Slug</th>
              <th className="px-4 py-3 font-medium text-slate-300">Venue</th>
              <th className="px-4 py-3 font-medium text-slate-300">Category</th>
              <th className="px-4 py-3 font-medium text-slate-300">Dates</th>
              <th className="px-4 py-3 font-medium text-slate-300">Status</th>
              <th className="px-4 py-3 font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No parent events yet. {canMutate && 'Create one to get started.'}
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-white">{e.title}</td>
                  <td className="px-4 py-3 text-slate-400">{e.slug}</td>
                  <td className="px-4 py-3 text-slate-400">{e.venueName}</td>
                  <td className="px-4 py-3 text-slate-400">{e.category}</td>
                  <td className="px-4 py-3 text-slate-400">{e._count.eventDates}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={e.isActive ? 'Active' : 'Inactive'}
                      variant={e.isActive ? 'success' : 'muted'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="text-slate-400 hover:text-white"
                    >
                      View
                    </Link>
                    {canMutate && (
                      <>
                        {' · '}
                        <Link
                          href={`/admin/events/${e.id}/edit`}
                          className="text-slate-400 hover:text-white"
                        >
                          Edit
                        </Link>
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
  );
}
