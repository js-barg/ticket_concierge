import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ParentEventEditForm } from './ParentEventEditForm';

type Props = { params: Promise<{ id: string }> };

export default async function AdminParentEventEditPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();
  if (!requireAdminMutation(session?.user ?? null)) {
    notFound();
  }

  const event = await prisma.parentEvent.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${id}`} className="text-slate-400 hover:text-white">
          ← {event.title}
        </Link>
        <h2 className="text-lg font-semibold text-white">Edit parent event</h2>
      </div>
      <ParentEventEditForm event={event} />
    </div>
  );
}
