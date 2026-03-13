export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getServerSession, requireAdminRole } from '@/lib/auth';
import { ReportsGenerateForm } from './ReportsGenerateForm';
import { DeleteReportButton } from './DeleteReportButton';

export default async function AdminReportsPage() {
  const session = await getServerSession();
  if (!session?.user || !requireAdminRole(session.user)) {
    return (
      <div className="text-sm text-red-300">
        You do not have permission to view reports.
      </div>
    );
  }

  const recentReports = await prisma.dailyReport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const firstOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const firstStr = firstOfMonth.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Reports</h2>
        <p className="text-sm text-slate-400">
          Generate daily sales and acquisition reports and download CSV exports.
        </p>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="text-sm font-medium text-white">Single day report</h3>
        <p className="mt-1 text-xs text-slate-500">
          Creates a saved report for one calendar day (UTC). If an order you placed &quot;today&quot; in your timezone doesn’t appear, try the previous or next day.
        </p>
        <ReportsGenerateForm defaultDate={todayStr} />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="text-sm font-medium text-white">Date range export</h3>
        <p className="mt-1 text-xs text-slate-500">
          Download CSV of all orders created between two dates (UTC). No report record is saved.
        </p>
        <form
          method="get"
          action="/api/reports/export"
          className="mt-3 flex flex-wrap items-end gap-3 text-sm"
        >
          <input type="hidden" name="type" value="dateRange" />
          <div>
            <label className="block text-xs text-slate-400">From</label>
            <input
              type="date"
              name="from"
              defaultValue={firstStr}
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400">To</label>
            <input
              type="date"
              name="to"
              defaultValue={todayStr}
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-slate-50 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-white"
          >
            Download CSV
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="text-sm font-medium text-white">Unfulfilled orders export</h3>
        <p className="mt-1 text-xs text-slate-500">
          Download CSV of all orders not yet delivered or cancelled (NEW, IN_PROGRESS, ACQUIRED, EXCEPTION).
        </p>
        <p className="mt-2">
          <a
            href="/api/reports/export?type=unfulfilled"
            className="inline-flex rounded bg-slate-50 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-white"
          >
            Download unfulfilled orders (CSV)
          </a>
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Recent reports</h3>
        {recentReports.length === 0 ? (
          <p className="text-sm text-slate-400">No reports generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Recipient</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Created at</th>
                  <th className="px-2 py-1">CSV</th>
                  <th className="px-2 py-1">Delete</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/60">
                    <td className="px-2 py-1">
                      {r.reportDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-2 py-1">
                      {r.recipientEmail || r.recipientUserId || '—'}
                    </td>
                    <td className="px-2 py-1">{r.status}</td>
                    <td className="px-2 py-1">{r.createdAt.toISOString()}</td>
                    <td className="px-2 py-1">
                      <Link
                        href={`/api/reports/daily/${r.id}/csv`}
                        className="text-slate-300 underline hover:text-white"
                      >
                        Download CSV
                      </Link>
                    </td>
                    <td className="px-2 py-1">
                      {session.user.role === 'ADMIN' && <DeleteReportButton id={r.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

