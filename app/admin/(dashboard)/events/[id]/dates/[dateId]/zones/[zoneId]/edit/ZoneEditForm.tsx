'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import type { Zone } from '@prisma/client';
import { updateZone } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect, AdminFormCheckbox } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';

export function ZoneEditForm({
  eventId,
  dateId,
  zoneId,
  zone
}: {
  eventId: string;
  dateId: string;
  zoneId: string;
  zone: Zone;
}) {
  const [state, formAction] = useFormState(
    (prev: { error: string | null } | null, fd: FormData) => updateZone(eventId, dateId, zoneId, prev, fd),
    { error: null }
  );

  const sourceSectionStr =
    zone.sourceSectionMapping != null
      ? typeof zone.sourceSectionMapping === 'string'
        ? zone.sourceSectionMapping
        : JSON.stringify(zone.sourceSectionMapping, null, 2)
      : '';

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />
      <input type="hidden" name="eventDateId" value={dateId} />
      <AdminFormField name="zoneName" label="Zone name" required defaultValue={zone.zoneName} />
      <AdminFormTextarea name="customerDescription" label="Customer description" defaultValue={zone.customerDescription ?? ''} />
      <AdminFormField name="displayOrder" label="Display order" type="number" defaultValue={zone.displayOrder} />
      <AdminFormField name="mapRegionKey" label="Map region key" defaultValue={zone.mapRegionKey ?? ''} />
      <AdminFormTextarea name="sourceSectionMapping" label="Source section mapping (JSON)" defaultValue={sourceSectionStr} rows={3} />
      <AdminFormField name="sourceObservedCost" label="Source observed cost" type="number" required defaultValue={Number(zone.sourceObservedCost)} />
      <AdminFormSelect
        name="markupType"
        label="Markup type"
        defaultValue={zone.markupType}
        options={[
          { value: 'INHERIT', label: 'Inherit' },
          { value: 'PERCENT', label: 'Percent' },
          { value: 'FLAT', label: 'Flat' }
        ]}
      />
      <AdminFormField name="markupValue" label="Markup value" type="number" defaultValue={zone.markupValue?.toString() ?? ''} />
      <AdminFormField name="marginBufferValue" label="Margin buffer value" type="number" defaultValue={zone.marginBufferValue?.toString() ?? ''} />
      <AdminFormSelect
        name="serviceFeeType"
        label="Service fee type"
        defaultValue={zone.serviceFeeType}
        options={[
          { value: 'INHERIT', label: 'Inherit' },
          { value: 'PER_ORDER_FLAT', label: 'Per order (flat)' },
          { value: 'PER_TICKET_FLAT', label: 'Per ticket (flat)' },
          { value: 'PERCENT', label: 'Percent' }
        ]}
      />
      <AdminFormField name="serviceFeeValue" label="Service fee value" type="number" defaultValue={zone.serviceFeeValue?.toString() ?? ''} />
      <AdminFormField name="publicPrice" label="Public price" type="number" defaultValue={zone.publicPrice?.toString() ?? ''} />
      <AdminFormField name="availableQuantity" label="Available quantity" type="number" required defaultValue={zone.availableQuantity} />
      <AdminFormField name="minPurchaseQty" label="Min purchase qty" type="number" defaultValue={zone.minPurchaseQty} />
      <AdminFormField name="maxPurchaseQty" label="Max purchase qty" type="number" defaultValue={zone.maxPurchaseQty?.toString() ?? ''} />
      <AdminFormSelect
        name="fulfillmentType"
        label="Fulfillment type"
        defaultValue={zone.fulfillmentType}
        options={[
          { value: 'ETICKET', label: 'eTicket' },
          { value: 'PRINT', label: 'Print' },
          { value: 'WILL_CALL', label: 'Will call' }
        ]}
      />
      <AdminFormCheckbox name="isActive" label="Active" defaultChecked={zone.isActive} />
      <AdminFormTextarea name="notes" label="Notes" defaultValue={zone.notes ?? ''} />

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
