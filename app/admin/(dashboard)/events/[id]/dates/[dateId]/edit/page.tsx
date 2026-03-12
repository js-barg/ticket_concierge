import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EventDateEditForm } from './EventDateEditForm';

type Props = { params: Promise<{ id: string; dateId: string }> };

export default async function AdminEventDateEditPage({ params }: Props) {
  const { id: eventId, dateId } = await params;
  const session = await getServerSession();
  if (!requireAdminMutation(session?.user ?? null)) {
    notFound();
  }

  const event = await prisma.parentEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true }
  });
  const eventDate = await prisma.eventDate.findUnique({
    where: { id: dateId, parentEventId: eventId }
  });

  if (!event || !eventDate) notFound();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${eventId}/dates/${dateId}`} className="text-slate-400 hover:text-white">
          ← {new Date(eventDate.performanceAt).toLocaleString()}
        </Link>
        <h2 className="text-lg font-semibold text-white">Edit event date</h2>
      </div>
      <EventDateEditForm eventId={eventId} dateId={dateId} eventDate={eventDate} users={users} />
    </div>
  );
}
