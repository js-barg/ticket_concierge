'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { createZone } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect, AdminFormCheckbox } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';

export function ZoneForm({ eventDateId, eventId }: { eventDateId: string; eventId: string }) {
  const [state, formAction] = useFormState(createZone, { error: null });

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />
      <input type="hidden" name="eventDateId" value={eventDateId} />
      <AdminFormField name="zoneName" label="Zone name" required />
      <AdminFormTextarea name="customerDescription" label="Customer description" />
      <AdminFormField name="displayOrder" label="Display order" type="number" defaultValue="0" />
      <AdminFormField name="mapRegionKey" label="Map region key" />
      <AdminFormField name="sourceSectionMapping" label="Source section mapping (JSON)" placeholder='{"sections": ["A","B"]}' />
      <AdminFormField name="sourceObservedCost" label="Source observed cost" type="number" required defaultValue="0" />
      <AdminFormSelect
        name="markupType"
        label="Markup type"
        defaultValue="INHERIT"
        options={[
          { value: 'INHERIT', label: 'Inherit' },
          { value: 'PERCENT', label: 'Percent' },
          { value: 'FLAT', label: 'Flat' }
        ]}
      />
      <AdminFormField name="markupValue" label="Markup value" type="number" />
      <AdminFormField name="marginBufferValue" label="Margin buffer value" type="number" />
      <AdminFormSelect
        name="serviceFeeType"
        label="Service fee type"
        defaultValue="INHERIT"
        options={[
          { value: 'INHERIT', label: 'Inherit' },
          { value: 'PER_ORDER_FLAT', label: 'Per order (flat)' },
          { value: 'PER_TICKET_FLAT', label: 'Per ticket (flat)' },
          { value: 'PERCENT', label: 'Percent' }
        ]}
      />
      <AdminFormField name="serviceFeeValue" label="Service fee value" type="number" />
      <AdminFormField name="publicPrice" label="Public price" type="number" />
      <AdminFormField name="availableQuantity" label="Available quantity" type="number" required defaultValue="0" />
      <AdminFormField name="minPurchaseQty" label="Min purchase qty" type="number" defaultValue="1" />
      <AdminFormField name="maxPurchaseQty" label="Max purchase qty" type="number" />
      <AdminFormSelect
        name="fulfillmentType"
        label="Fulfillment type"
        defaultValue="ETICKET"
        options={[
          { value: 'ETICKET', label: 'eTicket' },
          { value: 'PRINT', label: 'Print' },
          { value: 'WILL_CALL', label: 'Will call' }
        ]}
      />
      <AdminFormCheckbox name="isActive" label="Active" defaultChecked />
      <AdminFormTextarea name="notes" label="Notes" />

      <div className="flex gap-4 pt-4">
        <button type="submit" className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500">
          Create zone
        </button>
        <Link href={`/admin/events/${eventId}/dates/${eventDateId}`} className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
