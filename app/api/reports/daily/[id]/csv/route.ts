import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { AdminRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReportDataForDate, serializeReportToCsv } from '@/lib/reports';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = session.user.role as AdminRole;
  if (role !== 'ADMIN' && role !== 'FINANCE') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const daily = await prisma.dailyReport.findUnique({
    where: { id }
  });

  if (!daily) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const data = await getReportDataForDate(daily.reportDate);
  const csv = serializeReportToCsv({
    id: daily.id,
    reportDate: data.reportDate,
    rows: data.rows,
    createdAt: daily.createdAt
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="daily-report-${data.reportDate
        .toISOString()
        .slice(0, 10)}.csv"`
    }
  });
}

