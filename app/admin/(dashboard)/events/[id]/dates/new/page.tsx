import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EventDateForm } from './EventDateForm';

type Props = { params: Promise<{ id: string }> };

export default async function AdminNewEventDatePage({ params }: Props) {
  const { id: parentEventId } = await params;
  const session = await getServerSession();
  if (!requireAdminMutation(session?.user ?? null)) {
    redirect('/admin/events');
  }

  const event = await prisma.parentEvent.findUnique({
    where: { id: parentEventId },
    select: { id: true, title: true }
  });
  if (!event) notFound();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${parentEventId}`} className="text-slate-400 hover:text-white">
          ← {event.title}
        </Link>
        <h2 className="text-lg font-semibold text-white">New event date</h2>
      </div>
      <EventDateForm parentEventId={parentEventId} users={users} />
    </div>
  );
}
