import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-white">Event not found</h1>
      <p className="text-slate-400">This event may be inactive or the link may be incorrect.</p>
      <Link
        href="/"
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
      >
        Go home
      </Link>
    </div>
  );
}
