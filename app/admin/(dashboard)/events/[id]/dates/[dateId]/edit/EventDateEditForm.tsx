'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import type { EventDate } from '@prisma/client';
import { updateEventDate } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';

type User = { id: string; name: string; email: string };

function toDateTimeLocal(d: Date): string {
  const x = new Date(d);
  return x.toISOString().slice(0, 16);
}

export function EventDateEditForm({
  eventId,
  dateId,
  eventDate,
  users
}: {
  eventId: string;
  dateId: string;
  eventDate: EventDate;
  users: User[];
}) {
  const [state, formAction] = useFormState(
    (prev: { error: string | null } | null, fd: FormData) => updateEventDate(eventId, dateId, prev, fd),
    { error: null }
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />
      <input type="hidden" name="parentEventId" value={eventDate.parentEventId} />
      <AdminFormField
        name="performanceAt"
        label="Performance date & time"
        type="datetime-local"
        required
        defaultValue={toDateTimeLocal(eventDate.performanceAt)}
      />
      <AdminFormField name="timezone" label="Timezone" required defaultValue={eventDate.timezone} />
      <AdminFormSelect
        name="visibilityStatus"
        label="Visibility"
        defaultValue={eventDate.visibilityStatus}
        options={[
          { value: 'VISIBLE', label: 'Visible' },
          { value: 'HIDDEN', label: 'Hidden' }
        ]}
      />
      <AdminFormSelect
        name="saleStatus"
        label="Sale status"
        defaultValue={eventDate.saleStatus}
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
        defaultValue={toDateTimeLocal(eventDate.sellCutoffAt)}
      />
      <AdminFormField name="quantityCap" label="Quantity cap" type="number" defaultValue={eventDate.quantityCap ?? ''} />
      <AdminFormSelect
        name="assignedBuyerUserId"
        label="Assigned buyer"
        defaultValue={eventDate.assignedBuyerUserId ?? ''}
        options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
      />
      <AdminFormTextarea name="notes" label="Notes" defaultValue={eventDate.notes ?? ''} />

      <div className="flex gap-4 pt-4">
        <button type="submit" className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500">
          Save
        </button>
        <Link href={`/admin/events/${eventId}/dates/${dateId}`} className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
