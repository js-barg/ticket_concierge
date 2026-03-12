import Link from 'next/link';

export default function AdminZonesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Zones</h2>
      <p className="text-sm text-slate-400">
        Manage zones from an event date. Go to a parent event, then a date, to add or edit zones.
      </p>
      <Link href="/admin/events" className="text-slate-400 hover:text-white underline">
        View parent events →
      </Link>
    </div>
  );
}
