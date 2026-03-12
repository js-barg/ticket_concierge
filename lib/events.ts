import { prisma } from './db';

const VALID_VISIBILITY = 'VISIBLE' as const;
const VALID_SALE_STATUS = 'LIVE' as const;

export type ParentEventPageData = {
  id: string;
  slug: string;
  title: string;
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
  validDates: ValidEventDate[];
  galleryImageUrls: string[];
};

export type ValidEventDate = {
  id: string;
  performanceAt: string; // ISO
  timezone: string;
  zones: ZoneOption[];
  seatingMapUrl: string | null;
};

export type ZoneOption = {
  id: string;
  zoneName: string;
  customerDescription: string | null;
  displayOrder: number;
  publicPrice: number | null;
  availableQuantity: number;
  minPurchaseQty: number;
  maxPurchaseQty: number | null;
  fulfillmentType: string;
};

/**
 * Load parent event by slug for the public page.
 * Returns only event dates that are valid for sale (visible, live, before cutoff, not passed).
 * Business rules are applied server-side.
 */
export async function getParentEventPageData(slug: string): Promise<ParentEventPageData | null> {
  const parent = await prisma.parentEvent.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      eventDates: {
        where: {},
        orderBy: { performanceAt: 'asc' },
        include: {
          zones: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
          assets: { where: { assetType: 'SEATING_MAP' }, take: 1 }
        }
      }
    }
  });

  if (!parent) return null;

  const now = new Date();
  const validDates: ValidEventDate[] = parent.eventDates
    .filter(
      (d) =>
        d.visibilityStatus === VALID_VISIBILITY &&
        d.saleStatus === VALID_SALE_STATUS &&
        d.performanceAt > now &&
        d.sellCutoffAt > now
    )
    .map((d) => ({
      id: d.id,
      performanceAt: d.performanceAt.toISOString(),
      timezone: d.timezone,
      zones: d.zones.map((z) => ({
        id: z.id,
        zoneName: z.zoneName,
        customerDescription: z.customerDescription,
        displayOrder: z.displayOrder,
        publicPrice: z.publicPrice != null ? Number(z.publicPrice) : null,
        availableQuantity: z.availableQuantity,
        minPurchaseQty: z.minPurchaseQty,
        maxPurchaseQty: z.maxPurchaseQty,
        fulfillmentType: z.fulfillmentType
      })),
      seatingMapUrl: d.assets[0]?.assetUrl ?? null
    }));

  return {
    id: parent.id,
    slug: parent.slug,
    title: parent.title,
    venueName: parent.venueName,
    category: parent.category,
    marketingHeadline: parent.marketingHeadline,
    subheadline: parent.subheadline,
    eventDescription: parent.eventDescription,
    layoutTemplate: parent.layoutTemplate,
    primaryColor: parent.primaryColor,
    secondaryColor: parent.secondaryColor,
    accentColor: parent.accentColor,
    textTheme: parent.textTheme,
    heroImageUrl: parent.heroImageUrl,
    mobileHeroImageUrl: parent.mobileHeroImageUrl,
    disclosureBlock: parent.disclosureBlock,
    validDates,
    galleryImageUrls: parent.images.map((i) => i.imageUrl)
  };
}
