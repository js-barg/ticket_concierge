'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth';
import type { AdminRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateDailyReport } from '@/lib/reports';

export type GenerateReportResult = { ok: true; reportId: string } | { ok: false; error: string };

export async function generateDailyReportAction(
  _prev: GenerateReportResult | null,
  formData: FormData
): Promise<GenerateReportResult> {
  const session = await getServerSession();
  if (!session?.user) {
    return { ok: false, error: 'Not authenticated.' };
  }
  const role = session.user.role as AdminRole;
  if (role !== 'ADMIN' && role !== 'FINANCE') {
    return { ok: false, error: 'You do not have permission to generate reports.' };
  }

  const dateRaw = formData.get('date');
  if (!dateRaw || typeof dateRaw !== 'string') {
    return { ok: false, error: 'Report date is required.' };
  }
  const match = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { ok: false, error: 'Invalid date format.' };
  }
  const [, year, month, day] = match;
  // Use UTC so the same calendar day is used when loading the report for CSV
  const reportDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  const report = await generateDailyReport(reportDate);
  revalidatePath('/admin/reports');
  return { ok: true, reportId: report.id };
}

export async function deleteDailyReportAction(formData: FormData): Promise<void> {
  const session = await getServerSession();
  if (!session?.user) return;
  const role = session.user.role as AdminRole;
  if (role !== 'ADMIN') return;

  const id = formData.get('id');
  if (!id || typeof id !== 'string') return;

  await prisma.dailyReport.delete({ where: { id } });
  revalidatePath('/admin/reports');
}
