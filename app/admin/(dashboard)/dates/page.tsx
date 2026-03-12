import Link from 'next/link';

export default function AdminDatesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Event Dates</h2>
      <p className="text-sm text-slate-400">
        Manage event dates from a parent event. Go to a parent event to add or edit dates.
      </p>
      <Link href="/admin/events" className="text-slate-400 hover:text-white underline">
        View parent events →
      </Link>
    </div>
  );
}
