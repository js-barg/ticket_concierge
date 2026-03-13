import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { AdminRole } from '@/lib/auth';
import {
  getReportDataForDateRange,
  getReportDataForUnfulfilled,
  serializeRowsToCsv
} from '@/lib/reports';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const role = session.user.role as AdminRole;
  if (role !== 'ADMIN' && role !== 'FINANCE') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'unfulfilled') {
    const data = await getReportDataForUnfulfilled();
    const csv = serializeRowsToCsv(data.rows);
    const filename = `unfulfilled-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  if (type === 'dateRange') {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from || !DATE_RE.test(from) || !to || !DATE_RE.test(to)) {
      return NextResponse.json(
        { error: 'Query params from and to (YYYY-MM-DD) required for dateRange' },
        { status: 400 }
      );
    }
    const [fromY, fromM, fromD] = from.split('-').map(Number);
    const [toY, toM, toD] = to.split('-').map(Number);
    const fromDate = new Date(Date.UTC(fromY, fromM - 1, fromD));
    const toDate = new Date(Date.UTC(toY, toM - 1, toD));
    if (fromDate > toDate) {
      return NextResponse.json(
        { error: 'From date must be on or before to date' },
        { status: 400 }
      );
    }
    const data = await getReportDataForDateRange(fromDate, toDate);
    const csv = serializeRowsToCsv(data.rows);
    const filename = `orders-${from}-to-${to}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  return NextResponse.json(
    { error: 'Query param type must be "unfulfilled" or "dateRange"' },
    { status: 400 }
  );
}
