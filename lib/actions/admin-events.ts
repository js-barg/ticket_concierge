'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession, requireAdminMutation } from '../auth';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import {
  parentEventSchema,
  eventDateSchema,
  zoneSchema,
  type ParentEventFormData,
  type EventDateFormData,
  type ZoneFormData
} from '../validations/admin';

function formDataToObject(formData: FormData): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  formData.forEach((v, k) => {
    const key = k;
    if (v instanceof File) {
      if (v.size > 0 && v.name) o[key] = v;
      else o[key] = null;
    } else {
      const s = String(v).trim();
      if (s === '') o[key] = null;
      else if (s === 'true') o[key] = true;
      else if (s === 'false') o[key] = false;
      else o[key] = s;
    }
  });
  return o;
}

async function assertAdminMutation() {
  const session = await getServerSession();
  if (!requireAdminMutation(session?.user ?? null)) {
    throw new Error('Forbidden: only ADMIN can create or update event configuration.');
  }
}

type ActionState = { error: string | null };

export async function createParentEvent(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  await assertAdminMutation();
  const raw = formDataToObject(formData);
  const parsed = parentEventSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)[0]?.[1]?.[0] ?? parsed.error.message;
    return { error: msg ?? null };
  }
  const data = parsed.data as ParentEventFormData & { slug: string };
  const existing = await prisma.parentEvent.findUnique({ where: { slug: data.slug } });
  if (existing) return { error: 'A parent event with this slug already exists.' };

  await prisma.parentEvent.create({
    data: {
      title: data.title,
      slug: data.slug,
      venueName: data.venueName,
      category: data.category,
      marketingHeadline: data.marketingHeadline ?? null,
      subheadline: data.subheadline ?? null,
      eventDescription: data.eventDescription ?? null,
      layoutTemplate: data.layoutTemplate,
      primaryColor: data.primaryColor ?? null,
      secondaryColor: data.secondaryColor ?? null,
      accentColor: data.accentColor ?? null,
      textTheme: data.textTheme ?? null,
      heroImageUrl: data.heroImageUrl ?? null,
      mobileHeroImageUrl: data.mobileHeroImageUrl ?? null,
      disclosureBlock: data.disclosureBlock ?? null,
      defaultCutoffHours: data.defaultCutoffHours ?? null,
      defaultMarkupType: data.defaultMarkupType ?? null,
      defaultMarkupValue: data.defaultMarkupValue ?? null,
      defaultMarginBuffer: data.defaultMarginBuffer ?? null,
      defaultServiceFeeType: data.defaultServiceFeeType ?? null,
      defaultServiceFeeValue: data.defaultServiceFeeValue ?? null,
      isActive: data.isActive ?? true
    }
  });
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export async function updateParentEvent(id: string, _prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  await assertAdminMutation();
  const raw = formDataToObject(formData);
  const parsed = parentEventSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)[0]?.[1]?.[0] ?? parsed.error.message;
    return { error: msg ?? null };
  }
  const data = parsed.data;
  const existing = await prisma.parentEvent.findUnique({ where: { id } });
  if (!existing) return { error: 'Parent event not found.' };
  if (data.slug !== existing.slug) {
    const slugTaken = await prisma.parentEvent.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return { error: 'A parent event with this slug already exists.' };
  }

  await prisma.parentEvent.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      venueName: data.venueName,
      category: data.category,
      marketingHeadline: data.marketingHeadline ?? null,
      subheadline: data.subheadline ?? null,
      eventDescription: data.eventDescription ?? null,
      layoutTemplate: data.layoutTemplate,
      primaryColor: data.primaryColor ?? null,
      secondaryColor: data.secondaryColor ?? null,
      accentColor: data.accentColor ?? null,
      textTheme: data.textTheme ?? null,
      heroImageUrl: data.heroImageUrl ?? null,
      mobileHeroImageUrl: data.mobileHeroImageUrl ?? null,
      disclosureBlock: data.disclosureBlock ?? null,
      defaultCutoffHours: data.defaultCutoffHours ?? null,
      defaultMarkupType: data.defaultMarkupType ?? null,
      defaultMarkupValue: data.defaultMarkupValue ?? null,
      defaultMarginBuffer: data.defaultMarginBuffer ?? null,
      defaultServiceFeeType: data.defaultServiceFeeType ?? null,
      defaultServiceFeeValue: data.defaultServiceFeeValue ?? null,
      isActive: data.isActive ?? true
    }
  });
  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${id}`);
  revalidatePath(`/admin/events/${id}/edit`);
  redirect(`/admin/events/${id}`);
}

export async function deleteParentEvent(id: string): Promise<void> {
  await assertAdminMutation();
  await prisma.parentEvent.delete({ where: { id } });
  revalidatePath('/admin/events');
  redirect('/admin/events');
}

export async function deleteParentEventForm(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string') return;
  await deleteParentEvent(id);
}

export async function createEventDate(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  await assertAdminMutation();
  const raw = formDataToObject(formData);
  const parsed = eventDateSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)[0]?.[1]?.[0] ?? parsed.error.message;
    return { error: msg ?? null };
  }
  const data = parsed.data;
  const performanceAt = new Date(data.performanceAt);
  const sellCutoffAt = new Date(data.sellCutoffAt);

  const created = await prisma.eventDate.create({
    data: {
      parentEventId: data.parentEventId,
      performanceAt,
      timezone: data.timezone,
      visibilityStatus: data.visibilityStatus,
      saleStatus: data.saleStatus,
      sellCutoffAt,
      quantityCap: data.quantityCap ?? null,
      assignedBuyerUserId: data.assignedBuyerUserId || null,
      notes: data.notes ?? null
    }
  });
  revalidatePath(`/admin/events/${data.parentEventId}`);
  revalidatePath(`/admin/events/${data.parentEventId}/dates`);
  redirect(`/admin/events/${data.parentEventId}/dates/${created.id}`);
}

export async function updateEventDate(eventId: string, dateId: string, _prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  await assertAdminMutation();
  const raw = formDataToObject(formData);
  const parsed = eventDateSchema.safeParse({ ...raw, parentEventId: eventId });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)[0]?.[1]?.[0] ?? parsed.error.message;
    return { error: msg ?? null };
  }
  const data = parsed.data;
  const performanceAt = new Date(data.performanceAt);
  const sellCutoffAt = new Date(data.sellCutoffAt);

  await prisma.eventDate.update({
    where: { id: dateId },
    data: {
      performanceAt,
      timezone: data.timezone,
      visibilityStatus: data.visibilityStatus,
      saleStatus: data.saleStatus,
      sellCutoffAt,
      quantityCap: data.quantityCap ?? null,
      assignedBuyerUserId: data.assignedBuyerUserId || null,
      notes: data.notes ?? null
    }
  });
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/dates/${dateId}`);
  redirect(`/admin/events/${eventId}/dates/${dateId}`);
}

export async function deleteEventDate(eventId: string, dateId: string): Promise<void> {
  await assertAdminMutation();
  await prisma.eventDate.delete({ where: { id: dateId } });
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export async function deleteEventDateForm(formData: FormData): Promise<void> {
  const eventId = formData.get('eventId');
  const dateId = formData.get('dateId');
  if (typeof eventId !== 'string' || typeof dateId !== 'string') return;
  await deleteEventDate(eventId, dateId);
}

export async function createZone(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  await assertAdminMutation();
  const raw = formDataToObject(formData);
  const parsed = zoneSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)[0]?.[1]?.[0] ?? parsed.error.message;
    return { error: msg ?? null };
  }
  const data = parsed.data;
  let sourceSectionMapping: Prisma.InputJsonValue | undefined;
  if (typeof data.sourceSectionMapping === 'string' && data.sourceSectionMapping.trim() !== '') {
    try {
      sourceSectionMapping = JSON.parse(data.sourceSectionMapping) as Prisma.InputJsonValue;
    } catch {
      // ignore invalid JSON; don't write the field
      sourceSectionMapping = undefined;
    }
  }

  const created = await prisma.zone.create({
    data: {
      eventDateId: data.eventDateId,
      zoneName: data.zoneName,
      customerDescription: data.customerDescription ?? null,
      displayOrder: data.displayOrder ?? 0,
      mapRegionKey: data.mapRegionKey ?? null,
      ...(sourceSectionMapping !== undefined ? { sourceSectionMapping } : {}),
      sourceObservedCost: data.sourceObservedCost,
      markupType: data.markupType,
      markupValue: data.markupValue ?? null,
      marginBufferValue: data.marginBufferValue ?? null,
      serviceFeeType: data.serviceFeeType,
      serviceFeeValue: data.serviceFeeValue ?? null,
      publicPrice: data.publicPrice ?? null,
      availableQuantity: data.availableQuantity,
      minPurchaseQty: data.minPurchaseQty ?? 1,
      maxPurchaseQty: data.maxPurchaseQty ?? null,
      fulfillmentType: data.fulfillmentType,
      isActive: data.isActive ?? true,
      notes: data.notes ?? null
    }
  });
  const eventDate = await prisma.eventDate.findUnique({
    where: { id: data.eventDateId },
    select: { parentEventId: true }
  });
  if (eventDate) {
    revalidatePath(`/admin/events/${eventDate.parentEventId}`);
    revalidatePath(`/admin/events/${eventDate.parentEventId}/dates/${data.eventDateId}`);
  }
  redirect(`/admin/events/${eventDate?.parentEventId}/dates/${data.eventDateId}`);
}

export async function updateZone(
  eventId: string,
  dateId: string,
  zoneId: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  await assertAdminMutation();
  const raw = formDataToObject(formData);
  const parsed = zoneSchema.safeParse({ ...raw, eventDateId: dateId });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.entries(first)[0]?.[1]?.[0] ?? parsed.error.message;
    return { error: msg ?? null };
  }
  const data = parsed.data;
  let sourceSectionMapping:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | undefined;
  if (typeof data.sourceSectionMapping === 'string') {
    const trimmed = data.sourceSectionMapping.trim();
    if (trimmed === '') {
      // Explicitly clear the JSON column
      sourceSectionMapping = Prisma.DbNull;
    } else {
      try {
        sourceSectionMapping = JSON.parse(trimmed) as Prisma.InputJsonValue;
      } catch {
        // ignore invalid JSON; don't change existing value
        sourceSectionMapping = undefined;
      }
    }
  } else if (data.sourceSectionMapping === null) {
    // Empty field -> clear
    sourceSectionMapping = Prisma.DbNull;
  }

  await prisma.zone.update({
    where: { id: zoneId },
    data: {
      zoneName: data.zoneName,
      customerDescription: data.customerDescription ?? null,
      displayOrder: data.displayOrder ?? 0,
      mapRegionKey: data.mapRegionKey ?? null,
      ...(sourceSectionMapping !== undefined ? { sourceSectionMapping } : {}),
      sourceObservedCost: data.sourceObservedCost,
      markupType: data.markupType,
      markupValue: data.markupValue ?? null,
      marginBufferValue: data.marginBufferValue ?? null,
      serviceFeeType: data.serviceFeeType,
      serviceFeeValue: data.serviceFeeValue ?? null,
      publicPrice: data.publicPrice ?? null,
      availableQuantity: data.availableQuantity,
      minPurchaseQty: data.minPurchaseQty ?? 1,
      maxPurchaseQty: data.maxPurchaseQty ?? null,
      fulfillmentType: data.fulfillmentType,
      isActive: data.isActive ?? true,
      notes: data.notes ?? null
    }
  });
  revalidatePath(`/admin/events/${eventId}/dates/${dateId}`);
  redirect(`/admin/events/${eventId}/dates/${dateId}`);
}

export async function deleteZone(eventId: string, dateId: string, zoneId: string): Promise<void> {
  await assertAdminMutation();
  await prisma.zone.delete({ where: { id: zoneId } });
  revalidatePath(`/admin/events/${eventId}/dates/${dateId}`);
  redirect(`/admin/events/${eventId}/dates/${dateId}`);
}

export async function deleteZoneForm(formData: FormData): Promise<void> {
  const eventId = formData.get('eventId');
  const dateId = formData.get('dateId');
  const zoneId = formData.get('zoneId');
  if (typeof eventId !== 'string' || typeof dateId !== 'string' || typeof zoneId !== 'string') return;
  await deleteZone(eventId, dateId, zoneId);
}
