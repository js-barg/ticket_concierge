'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { createEventDate } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';

type User = { id: string; name: string; email: string };

export function EventDateForm({ parentEventId, users }: { parentEventId: string; users: User[] }) {
  const [state, formAction] = useFormState(createEventDate, { error: null });

  const now = new Date();
  const defaultPerformance = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const defaultCutoff = new Date(defaultPerformance.getTime() - 6 * 60 * 60 * 1000);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />
      <input type="hidden" name="parentEventId" value={parentEventId} />
      <AdminFormField
        name="performanceAt"
        label="Performance date & time"
        type="datetime-local"
        required
        defaultValue={defaultPerformance.toISOString().slice(0, 16)}
      />
      <AdminFormField name="timezone" label="Timezone" required defaultValue="America/New_York" />
      <AdminFormSelect
        name="visibilityStatus"
        label="Visibility"
        defaultValue="VISIBLE"
        options={[
          { value: 'VISIBLE', label: 'Visible' },
          { value: 'HIDDEN', label: 'Hidden' }
        ]}
      />
      <AdminFormSelect
        name="saleStatus"
        label="Sale status"
        defaultValue="DRAFT"
        options={[
          { value: 'DRAFT', label: 'Draft' },
          { value: 'LIVE', label: 'Live' },
          { value: 'CUTOFF', label: 'Cutoff' },
          { value: 'SOLD_OUT', label: 'Sold out' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'ARCHIVED', label: 'Archived' }
        ]}
      />
      <AdminFormField
        name="sellCutoffAt"
        label="Sell cutoff date & time"
        type="datetime-local"
        required
        defaultValue={defaultCutoff.toISOString().slice(0, 16)}
      />
      <AdminFormField name="quantityCap" label="Quantity cap" type="number" placeholder="8" />
      <AdminFormSelect
        name="assignedBuyerUserId"
        label="Assigned buyer"
        options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
      />
      <AdminFormTextarea name="notes" label="Notes" />

      <div className="flex gap-4 pt-4">
        <button type="submit" className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500">
          Create event date
        </button>
        <Link href={`/admin/events/${parentEventId}`} className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
