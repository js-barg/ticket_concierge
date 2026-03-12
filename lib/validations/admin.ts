import { z } from 'zod';

const optionalString = z.string().optional().nullable();
const optionalNumber = z.number().optional().nullable();

const optionalNonNegativeNumber = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? undefined : value),
  z.coerce.number().min(0).optional()
);

export const parentEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens only'),
  venueName: z.string().min(1, 'Venue name is required'),
  category: z.string().min(1, 'Category is required'),
  marketingHeadline: optionalString,
  subheadline: optionalString,
  eventDescription: optionalString,
  layoutTemplate: z.string().min(1, 'Layout template is required'),
  primaryColor: optionalString,
  secondaryColor: optionalString,
  accentColor: optionalString,
  textTheme: optionalString,
  heroImageUrl: optionalString,
  mobileHeroImageUrl: optionalString,
  disclosureBlock: optionalString,
  defaultCutoffHours: optionalNonNegativeNumber,
  defaultMarkupType: z.enum(['PERCENT', 'FLAT']).optional().nullable(),
  defaultMarkupValue: optionalNonNegativeNumber,
  defaultMarginBuffer: optionalNonNegativeNumber,
  defaultServiceFeeType: z.enum(['PER_ORDER_FLAT', 'PER_TICKET_FLAT', 'PERCENT']).optional().nullable(),
  defaultServiceFeeValue: optionalNonNegativeNumber,
  isActive: z.boolean().default(true)
});

const datetimeLocal = z.string().min(1).refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date/time' });

export const eventDateSchema = z.object({
  parentEventId: z.string().uuid(),
  performanceAt: datetimeLocal,
  timezone: z.string().min(1, 'Timezone is required'),
  visibilityStatus: z.enum(['VISIBLE', 'HIDDEN']).default('VISIBLE'),
  saleStatus: z.enum(['DRAFT', 'LIVE', 'CUTOFF', 'SOLD_OUT', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
  sellCutoffAt: datetimeLocal,
  quantityCap: z.coerce.number().int().min(1).optional().nullable(),
  assignedBuyerUserId: optionalString,
  notes: optionalString
});

export const zoneSchema = z.object({
  eventDateId: z.string().uuid(),
  zoneName: z.string().min(1, 'Zone name is required'),
  customerDescription: optionalString,
  displayOrder: z.coerce.number().int().min(0).default(0),
  mapRegionKey: optionalString,
  sourceSectionMapping: optionalString, // JSON string; stored as Json in DB
  sourceObservedCost: z.coerce.number().min(0),
  markupType: z.enum(['INHERIT', 'PERCENT', 'FLAT']).default('INHERIT'),
  markupValue: z.coerce.number().min(0).optional().nullable(),
  marginBufferValue: z.coerce.number().min(0).optional().nullable(),
  serviceFeeType: z.enum(['INHERIT', 'PER_ORDER_FLAT', 'PER_TICKET_FLAT', 'PERCENT']).default('INHERIT'),
  serviceFeeValue: z.coerce.number().min(0).optional().nullable(),
  publicPrice: z.coerce.number().min(0).optional().nullable(),
  availableQuantity: z.coerce.number().int().min(0),
  minPurchaseQty: z.coerce.number().int().min(1).default(1),
  maxPurchaseQty: z.coerce.number().int().min(1).optional().nullable(),
  fulfillmentType: z.enum(['ETICKET', 'PRINT', 'WILL_CALL']),
  isActive: z.boolean().default(true),
  notes: optionalString
});

export type ParentEventFormData = z.infer<typeof parentEventSchema>;
export type EventDateFormData = z.infer<typeof eventDateSchema>;
export type ZoneFormData = z.infer<typeof zoneSchema>;
