'use client';

import { useTransition } from 'react';
import { deleteDailyReportAction } from '@/lib/actions/admin-reports';

export function DeleteReportButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.append('id', id);
          await deleteDailyReportAction(formData);
          // Force a hard reload so the list always reflects the latest state.
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        })
      }
      disabled={pending}
      className="text-red-300 underline hover:text-red-200 disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}

