'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { createParentEvent } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect, AdminFormCheckbox } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';

export function ParentEventForm() {
  const [state, formAction] = useFormState(createParentEvent, { error: null as string | null });

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />
      <AdminFormField name="title" label="Title" required />
      <AdminFormField name="slug" label="Slug (URL)" required placeholder="my-event-slug" />
      <AdminFormField name="venueName" label="Venue name" required />
      <AdminFormField name="category" label="Category" required placeholder="Theater" />
      <AdminFormField name="marketingHeadline" label="Marketing headline" />
      <AdminFormField name="subheadline" label="Subheadline" />
      <AdminFormTextarea name="eventDescription" label="Event description" />
      <AdminFormField name="layoutTemplate" label="Layout template" required defaultValue="hero-zones" />
      <AdminFormField name="primaryColor" label="Primary color" placeholder="#111111" />
      <AdminFormField name="secondaryColor" label="Secondary color" placeholder="#f5f5f5" />
      <AdminFormField name="accentColor" label="Accent color" placeholder="#d4af37" />
      <AdminFormField name="textTheme" label="Text theme" placeholder="light" />
      <AdminFormField name="heroImageUrl" label="Hero image URL" placeholder="/placeholder-hero.jpg" />
      <AdminFormField name="mobileHeroImageUrl" label="Mobile hero image URL" />
      <AdminFormTextarea name="disclosureBlock" label="Disclosure block" />
      <AdminFormField name="defaultCutoffHours" label="Default cutoff (hours)" type="number" placeholder="6" />
      <AdminFormSelect
        name="defaultMarkupType"
        label="Default markup type"
        options={[
          { value: 'PERCENT', label: 'Percent' },
          { value: 'FLAT', label: 'Flat' }
        ]}
      />
      <AdminFormField name="defaultMarkupValue" label="Default markup value" type="number" />
      <AdminFormField name="defaultMarginBuffer" label="Default margin buffer" type="number" />
      <AdminFormSelect
        name="defaultServiceFeeType"
        label="Default service fee type"
        options={[
          { value: 'PER_ORDER_FLAT', label: 'Per order (flat)' },
          { value: 'PER_TICKET_FLAT', label: 'Per ticket (flat)' },
          { value: 'PERCENT', label: 'Percent' }
        ]}
      />
      <AdminFormField name="defaultServiceFeeValue" label="Default service fee value" type="number" />
      <AdminFormCheckbox name="isActive" label="Active" defaultChecked />

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500"
        >
          Create parent event
        </button>
        <Link href="/admin/events" className="rounded border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
