import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession, requireAdminRole } from '../../../lib/auth';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/events', label: 'Parent Events' },
  { href: '/admin/dates', label: 'Event Dates' },
  { href: '/admin/zones', label: 'Zones' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/queue', label: 'Fulfillment Queue' },
  { href: '/admin/reports', label: 'Reports' }
];

export default async function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/admin/login?callbackUrl=/admin');
  }
  if (!requireAdminRole(session.user)) {
    redirect('/admin/login?callbackUrl=/admin&error=Unauthorized');
  }

  return (
    <div className="flex gap-8">
      <aside className="w-52 shrink-0 space-y-4 border-r border-slate-700 pr-6">
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-700 pt-4 text-xs text-slate-500">
          {session.user.email}
          <span className="ml-1">({session.user.role})</span>
        </div>
        <Link
          href="/api/auth/signout"
          className="block text-sm text-slate-400 hover:text-white"
        >
          Sign out
        </Link>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
