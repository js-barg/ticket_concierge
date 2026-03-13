import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import type { AdminRole } from '@/lib/auth';
import { generateDailyReport } from '@/lib/reports';

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  buyerId: z.string().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = session.user.role as AdminRole;
  if (role !== 'ADMIN' && role !== 'FINANCE') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { date, buyerId } = parsed.data;
  const [year, month, day] = date.split('-').map((p) => Number(p));
  const reportDate = new Date(Date.UTC(year, month - 1, day));

  const report = await generateDailyReport(reportDate, { buyerId });

  return NextResponse.json({ ok: true, reportId: report.id });
}

