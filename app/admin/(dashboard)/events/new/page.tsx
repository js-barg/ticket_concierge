import Link from 'next/link';
import { getServerSession, requireAdminMutation } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ParentEventForm } from './ParentEventForm';

export default async function AdminNewParentEventPage() {
  const session = await getServerSession();
  if (!requireAdminMutation(session?.user ?? null)) {
    redirect('/admin/events');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events" className="text-slate-400 hover:text-white">
          ← Parent events
        </Link>
        <h2 className="text-lg font-semibold text-white">New parent event</h2>
      </div>
      <ParentEventForm />
    </div>
  );
}
