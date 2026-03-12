import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const devPasswordHash = await hash('password', 10);

  // Users: one admin, one fulfillment (dev password "password" for local login)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: devPasswordHash },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: devPasswordHash,
      isActive: true
    }
  });

  const fulfillmentUser = await prisma.user.upsert({
    where: { email: 'fulfillment@example.com' },
    update: { passwordHash: devPasswordHash },
    create: {
      email: 'fulfillment@example.com',
      name: 'Fulfillment User',
      role: 'FULFILLMENT',
      passwordHash: devPasswordHash,
      isActive: true
    }
  });

  // One sample parent event
  const parentEvent = await prisma.parentEvent.upsert({
    where: { slug: 'hamilton-dr-phillips-center' },
    update: {},
    create: {
      slug: 'hamilton-dr-phillips-center',
      title: 'Hamilton at Dr. Phillips Center',
      venueName: 'Dr. Phillips Center',
      category: 'Theater',
      marketingHeadline: 'Premium access made simple',
      subheadline: 'Choose your date and seating zone',
      eventDescription:
        'Experience the smash-hit musical at Dr. Phillips Center. Tickets sold by zone; seats together when available.',
      layoutTemplate: 'hero-zones',
      primaryColor: '#111111',
      secondaryColor: '#f5f5f5',
      accentColor: '#d4af37',
      textTheme: 'light',
      heroImageUrl: null,
      mobileHeroImageUrl: null,
      disclosureBlock: 'Tickets sold by zone. Not affiliated with venue or original seller.',
      defaultCutoffHours: 6,
      defaultMarkupType: 'PERCENT',
      defaultMarkupValue: 25,
      defaultMarginBuffer: 5,
      defaultServiceFeeType: 'PER_ORDER_FLAT',
      defaultServiceFeeValue: 5,
      isActive: true
    }
  });

  // Gallery image for the parent event (one placeholder if none exist)
  const existingImages = await prisma.parentEventImage.count({
    where: { parentEventId: parentEvent.id }
  });
  if (existingImages === 0) {
    await prisma.parentEventImage.create({
      data: {
        parentEventId: parentEvent.id,
        imageUrl: '/placeholder-hero.jpg',
        sortOrder: 0,
        altText: 'Hamilton at Dr. Phillips Center'
      }
    });
  }

  // Multiple event dates (same parent event) — only if none exist yet (idempotent)
  const existingDates = await prisma.eventDate.count({ where: { parentEventId: parentEvent.id } });
  if (existingDates === 0) {
    const timezone = 'America/New_York';
    const dates: { performanceAt: Date; sellCutoffAt: Date }[] = [
      { performanceAt: new Date('2026-04-08T19:30:00'), sellCutoffAt: new Date('2026-04-08T13:30:00') },
      { performanceAt: new Date('2026-04-09T14:00:00'), sellCutoffAt: new Date('2026-04-09T08:00:00') },
      { performanceAt: new Date('2026-04-09T19:30:00'), sellCutoffAt: new Date('2026-04-09T13:30:00') }
    ];

    for (const { performanceAt, sellCutoffAt } of dates) {
      const eventDate = await prisma.eventDate.create({
        data: {
          parentEventId: parentEvent.id,
          performanceAt,
          timezone,
          visibilityStatus: 'VISIBLE',
          saleStatus: 'LIVE',
          sellCutoffAt,
          quantityCap: 8,
          assignedBuyerUserId: fulfillmentUser.id
        }
      });

      await prisma.eventDateAsset.create({
        data: {
          eventDateId: eventDate.id,
          assetType: 'SEATING_MAP',
          assetUrl: '/placeholder-seating-map.png',
          label: 'Seating map'
        }
      });

      const zonesData = [
        {
          zoneName: 'Lower Level Center',
          customerDescription: 'Best views, center section',
          displayOrder: 0,
          sourceObservedCost: 120,
          publicPrice: 165,
          availableQuantity: 20,
          minPurchaseQty: 1,
          maxPurchaseQty: 4,
          fulfillmentType: 'ETICKET' as const
        },
        {
          zoneName: 'Upper Level',
          customerDescription: 'Great value, elevated view',
          displayOrder: 1,
          sourceObservedCost: 65,
          publicPrice: 89,
          availableQuantity: 40,
          minPurchaseQty: 1,
          maxPurchaseQty: 6,
          fulfillmentType: 'ETICKET' as const
        },
        {
          zoneName: 'Balcony',
          customerDescription: 'Budget-friendly option',
          displayOrder: 2,
          sourceObservedCost: 45,
          publicPrice: 62,
          availableQuantity: 30,
          minPurchaseQty: 1,
          maxPurchaseQty: 8,
          fulfillmentType: 'PRINT' as const
        }
      ];

      for (const z of zonesData) {
        await prisma.zone.create({
          data: {
            eventDateId: eventDate.id,
            zoneName: z.zoneName,
            customerDescription: z.customerDescription,
            displayOrder: z.displayOrder,
            sourceObservedCost: z.sourceObservedCost,
            publicPrice: z.publicPrice,
            availableQuantity: z.availableQuantity,
            minPurchaseQty: z.minPurchaseQty,
            maxPurchaseQty: z.maxPurchaseQty,
            fulfillmentType: z.fulfillmentType,
            markupType: 'INHERIT',
            serviceFeeType: 'INHERIT',
            isActive: true
          }
        });
      }
    }
  }

  const SEATING_MAP_PLACEHOLDER_PNG = '/placeholder-seating-map.png';

  // Backfill or fix seating map asset: create if missing, or update old .jpg placeholder to .png
  const eventDatesWithSeatingMap = await prisma.eventDate.findMany({
    where: { parentEventId: parentEvent.id },
    include: { assets: { where: { assetType: 'SEATING_MAP' } } }
  });
  for (const ed of eventDatesWithSeatingMap) {
    const seatingMapAsset = ed.assets[0];
    if (!seatingMapAsset) {
      await prisma.eventDateAsset.create({
        data: {
          eventDateId: ed.id,
          assetType: 'SEATING_MAP',
          assetUrl: SEATING_MAP_PLACEHOLDER_PNG,
          label: 'Seating map'
        }
      });
    } else if (seatingMapAsset.assetUrl.endsWith('.jpg') || seatingMapAsset.assetUrl.includes('placeholder-seating-map')) {
      await prisma.eventDateAsset.update({
        where: { id: seatingMapAsset.id },
        data: { assetUrl: SEATING_MAP_PLACEHOLDER_PNG }
      });
    }
  }

  console.log('Seed completed: admin user, fulfillment user, sample parent event with dates and zones.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
