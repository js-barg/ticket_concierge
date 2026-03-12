'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { updateParentEvent } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect, AdminFormCheckbox } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';

export type EditableParentEvent = {
  id: string;
  title: string;
  slug: string;
  venueName: string;
  category: string;
  marketingHeadline: string | null;
  subheadline: string | null;
  eventDescription: string | null;
  layoutTemplate: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  textTheme: string | null;
  heroImageUrl: string | null;
  mobileHeroImageUrl: string | null;
  disclosureBlock: string | null;
  defaultCutoffHours: number | null;
  defaultMarkupType: 'PERCENT' | 'FLAT' | null;
  defaultMarkupValue: number | null;
  defaultMarginBuffer: number | null;
  defaultServiceFeeType: 'PER_ORDER_FLAT' | 'PER_TICKET_FLAT' | 'PERCENT' | null;
  defaultServiceFeeValue: number | null;
  isActive: boolean;
};

export function ParentEventEditForm({ event }: { event: EditableParentEvent }) {
  const [state, formAction] = useFormState(
    (prev: { error: string | null } | null, fd: FormData) => updateParentEvent(event.id, prev, fd),
    { error: null }
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />
      <AdminFormField name="title" label="Title" required defaultValue={event.title} />
      <AdminFormField name="slug" label="Slug (URL)" required defaultValue={event.slug} />
      <AdminFormField name="venueName" label="Venue name" required defaultValue={event.venueName} />
      <AdminFormField name="category" label="Category" required defaultValue={event.category} />
      <AdminFormField name="marketingHeadline" label="Marketing headline" defaultValue={event.marketingHeadline ?? ''} />
      <AdminFormField name="subheadline" label="Subheadline" defaultValue={event.subheadline ?? ''} />
      <AdminFormTextarea name="eventDescription" label="Event description" defaultValue={event.eventDescription ?? ''} />
      <AdminFormField name="layoutTemplate" label="Layout template" required defaultValue={event.layoutTemplate} />
      <AdminFormField name="primaryColor" label="Primary color" defaultValue={event.primaryColor ?? ''} />
      <AdminFormField name="secondaryColor" label="Secondary color" defaultValue={event.secondaryColor ?? ''} />
      <AdminFormField name="accentColor" label="Accent color" defaultValue={event.accentColor ?? ''} />
      <AdminFormField name="textTheme" label="Text theme" defaultValue={event.textTheme ?? ''} />
      <AdminFormField name="heroImageUrl" label="Hero image URL" defaultValue={event.heroImageUrl ?? ''} />
      <AdminFormField name="mobileHeroImageUrl" label="Mobile hero image URL" defaultValue={event.mobileHeroImageUrl ?? ''} />
      <AdminFormTextarea name="disclosureBlock" label="Disclosure block" defaultValue={event.disclosureBlock ?? ''} />
      <AdminFormField name="defaultCutoffHours" label="Default cutoff (hours)" type="number" defaultValue={event.defaultCutoffHours ?? ''} />
      <AdminFormSelect
        name="defaultMarkupType"
        label="Default markup type"
        defaultValue={event.defaultMarkupType ?? ''}
        options={[
          { value: 'PERCENT', label: 'Percent' },
          { value: 'FLAT', label: 'Flat' }
        ]}
      />
      <AdminFormField name="defaultMarkupValue" label="Default markup value" type="number" defaultValue={event.defaultMarkupValue?.toString() ?? ''} />
      <AdminFormField name="defaultMarginBuffer" label="Default margin buffer" type="number" defaultValue={event.defaultMarginBuffer?.toString() ?? ''} />
      <AdminFormSelect
        name="defaultServiceFeeType"
        label="Default service fee type"
        defaultValue={event.defaultServiceFeeType ?? ''}
        options={[
          { value: 'PER_ORDER_FLAT', label: 'Per order (flat)' },
          { value: 'PER_TICKET_FLAT', label: 'Per ticket (flat)' },
          { value: 'PERCENT', label: 'Percent' }
        ]}
      />
      <AdminFormField name="defaultServiceFeeValue" label="Default service fee value" type="number" defaultValue={event.defaultServiceFeeValue?.toString() ?? ''} />
      <AdminFormCheckbox name="isActive" label="Active" defaultChecked={event.isActive} />

      <div className="flex gap-4 pt-4">
        <button type="submit" className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500">
          Save
        </button>
        <Link href={`/admin/events/${event.id}`} className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
