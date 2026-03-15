'use client';

import { useRef } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { updateParentEvent } from '@/lib/actions/admin-events';
import { AdminFormField, AdminFormTextarea, AdminFormSelect, AdminFormCheckbox } from '@/admin-components/AdminFormField';
import { FormError } from '@/admin-components/FormError';
import { PRESET_THEMES, type PresetThemeId } from '@/lib/theme';

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

const PRESET_OPTIONS: { value: PresetThemeId; label: string }[] = [
  { value: 'dark_gold', label: 'Dark & Gold' },
  { value: 'navy_white', label: 'Navy & White' },
  { value: 'burgundy', label: 'Burgundy' },
  { value: 'slate', label: 'Slate' }
];

export function ParentEventEditForm({ event }: { event: EditableParentEvent }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(
    (prev: { error: string | null } | null, fd: FormData) => updateParentEvent(event.id, prev, fd),
    { error: null }
  );

  function applyPreset(presetId: PresetThemeId) {
    const form = formRef.current;
    if (!form) return;
    const preset = PRESET_THEMES[presetId];
    const set = (name: string, value: string) => {
      const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
      if (input) input.value = value;
    };
    set('primaryColor', preset.primary);
    set('secondaryColor', preset.secondary);
    set('accentColor', preset.accent);
  }

  return (
    <form ref={formRef} action={formAction} className="max-w-2xl space-y-4">
      <FormError message={state?.error} />

      {/* Theme / color palette — first so it's easy to find; event page + Stripe Checkout */}
      <div className="rounded-lg border-2 border-amber-600/50 bg-slate-800/70 p-4">
        <h3 className="mb-1 text-base font-semibold text-amber-200">
          Event theme &amp; colors
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          Choose a preset or edit hex values below. Used on the public event page and Stripe Checkout.
        </p>
        <div className="mb-3">
          <label htmlFor="theme-preset" className="mb-1 block text-sm font-medium text-white">
            Preset color palette
          </label>
          <select
            id="theme-preset"
            className="w-full max-w-sm rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm font-medium text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value as PresetThemeId | '';
              if (v && v in PRESET_THEMES) applyPreset(v);
            }}
          >
            <option value="">— Choose a preset —</option>
            {PRESET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminFormField name="primaryColor" label="Primary color" defaultValue={event.primaryColor ?? ''} placeholder="#0f172a" />
          <AdminFormField name="secondaryColor" label="Secondary color" defaultValue={event.secondaryColor ?? ''} placeholder="#1e293b" />
          <AdminFormField name="accentColor" label="Accent color" defaultValue={event.accentColor ?? ''} placeholder="#d4af37" />
        </div>
      </div>

      <AdminFormField name="title" label="Title" required defaultValue={event.title} />
      <AdminFormField name="slug" label="Slug (URL)" required defaultValue={event.slug} />
      <AdminFormField name="venueName" label="Venue name" required defaultValue={event.venueName} />
      <AdminFormField name="category" label="Category" required defaultValue={event.category} />
      <AdminFormField name="marketingHeadline" label="Marketing headline" defaultValue={event.marketingHeadline ?? ''} />
      <AdminFormField name="subheadline" label="Subheadline" defaultValue={event.subheadline ?? ''} />
      <AdminFormTextarea name="eventDescription" label="Event description" defaultValue={event.eventDescription ?? ''} />
      <AdminFormField name="layoutTemplate" label="Layout template" required defaultValue={event.layoutTemplate} />
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
