import { prisma } from './db';

export async function sweepEventDateCutoffs(now: Date = new Date()): Promise<number> {
  const updated = await prisma.eventDate.updateMany({
    where: {
      saleStatus: 'LIVE',
      sellCutoffAt: {
        lte: now
      }
    },
    data: {
      saleStatus: 'CUTOFF'
    }
  });
  return updated.count;
}

export async function sweepCompletedEvents(now: Date = new Date()): Promise<number> {
  const updated = await prisma.eventDate.updateMany({
    where: {
      performanceAt: {
        lte: now
      },
      saleStatus: {
        notIn: ['COMPLETED', 'ARCHIVED']
      }
    },
    data: {
      saleStatus: 'COMPLETED'
    }
  });
  return updated.count;
}

export async function retryFailedNotifications(): Promise<void> {
  const failed = await prisma.notification.count({
    where: { deliveryStatus: 'FAILED' }
  });
  if (failed > 0) {
    console.log(`[notifications] Found ${failed} failed notifications (retry placeholder).`);
  }
}

