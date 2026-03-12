import type { AdminRole } from './auth';
import type { PaymentStatus, FulfillmentStatus } from '@prisma/client';

export type OrderForPerms = {
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  assignedBuyerUserId: string | null;
};

export type OrderAction =
  | 'assignBuyer'
  | 'setFulfillmentStatus'
  | 'setDeliveryStatus'
  | 'setExceptionStatus'
  | 'addNote';

export function canViewOrder(_role: AdminRole): boolean {
  return true;
}

export function canMutateOrder(
  role: AdminRole,
  action: OrderAction,
  order: OrderForPerms,
  currentUserId: string
): boolean {
  if (role === 'FINANCE') return false;
  if (role === 'ADMIN') return true;

  // FULFILLMENT rules
  if (role === 'FULFILLMENT') {
    if (order.paymentStatus !== 'PAID') return false;

    switch (action) {
      case 'assignBuyer':
        // Can assign to self if unassigned or already self
        return order.assignedBuyerUserId === null || order.assignedBuyerUserId === currentUserId;
      case 'setFulfillmentStatus':
      case 'setDeliveryStatus':
      case 'setExceptionStatus':
      case 'addNote':
        return true;
      default:
        return false;
    }
  }

  return false;
}

