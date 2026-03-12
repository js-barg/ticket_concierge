import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Scaffold is ready</h2>
      <p className="text-sm text-slate-300">
        This is the Phase 1 foundation: a local-first Next.js, TypeScript, Tailwind, Prisma, and
        Docker setup designed to be compatible with future Google Cloud Run deployment. Business
        features, checkout, admin, and reporting are intentionally not implemented yet.
      </p>
      <p className="text-sm text-slate-400">
        <Link href="/hamilton-dr-phillips-center" className="underline hover:text-slate-300">
          View sample event page
        </Link>{' '}
        (Phase 3 public event page).
      </p>
    </div>
  );
}

