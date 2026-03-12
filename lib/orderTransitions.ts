import type {
  FulfillmentStatus,
  DeliveryStatus,
  ExceptionStatus,
  PaymentStatus
} from '@prisma/client';

export type OrderForTransition = {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  deliveryStatus: DeliveryStatus;
  exceptionStatus: ExceptionStatus;
};

export function assertCanChangeFulfillment(
  order: OrderForTransition,
  next: FulfillmentStatus
): void {
  const current = order.fulfillmentStatus;

  const allowedMap: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    NEW: ['IN_PROGRESS', 'EXCEPTION', 'CANCELLED'],
    IN_PROGRESS: ['ACQUIRED', 'EXCEPTION', 'CANCELLED'],
    ACQUIRED: ['DELIVERED', 'EXCEPTION'],
    DELIVERED: [],
    EXCEPTION: [],
    CANCELLED: []
  };

  const allowedNext = allowedMap[current] ?? [];
  if (!allowedNext.includes(next)) {
    throw new Error(`Cannot change fulfillment status from ${current} to ${next}.`);
  }
}

export function assertCanChangeDelivery(
  order: OrderForTransition,
  next: DeliveryStatus
): void {
  const current = order.deliveryStatus;
  const allowedMap: Record<DeliveryStatus, DeliveryStatus[]> = {
    PENDING: ['SENT', 'DELIVERED', 'PICKUP_READY'],
    SENT: ['DELIVERED'],
    DELIVERED: [],
    PICKUP_READY: ['DELIVERED']
  };
  const allowedNext = allowedMap[current] ?? [];
  if (!allowedNext.includes(next)) {
    throw new Error(`Cannot change delivery status from ${current} to ${next}.`);
  }
}

export function assertCanSetException(
  order: OrderForTransition,
  next: ExceptionStatus
): void {
  if (order.exceptionStatus !== 'NONE' && next !== 'NONE') {
    throw new Error('Exception is already set; clear or resolve before setting another.');
  }
}

