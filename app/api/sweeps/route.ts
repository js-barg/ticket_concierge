import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import type { AdminRole } from '@/lib/auth';
import { sweepCompletedEvents, sweepEventDateCutoffs, retryFailedNotifications } from '@/lib/sweeps';

export async function POST() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const role = session.user.role as AdminRole;
  if (role !== 'ADMIN') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const [cutoffs, completed] = await Promise.all([
    sweepEventDateCutoffs(now),
    sweepCompletedEvents(now)
  ]);
  await retryFailedNotifications();

  return NextResponse.json({
    ok: true,
    cutoffsUpdated: cutoffs,
    eventsCompletedUpdated: completed
  });
}

