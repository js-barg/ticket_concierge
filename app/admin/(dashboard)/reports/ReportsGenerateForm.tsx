'use client';

import { useActionState } from 'react';
import { generateDailyReportAction } from '@/lib/actions/admin-reports';

type Props = {
  defaultDate: string;
};

export function ReportsGenerateForm({ defaultDate }: Props) {
  const [state, formAction] = useActionState(generateDailyReportAction, null);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3 text-sm">
      <div>
        <label className="block text-xs text-slate-400">Report date</label>
        <input
          type="date"
          name="date"
          defaultValue={defaultDate}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-slate-50 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-white"
      >
        Generate
      </button>
      {state?.ok === false && (
        <p className="w-full text-sm text-red-300">{state.error}</p>
      )}
      {state?.ok === true && (
        <p className="w-full text-sm text-emerald-300">Report generated.</p>
      )}
    </form>
  );
}
