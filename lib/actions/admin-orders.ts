'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canMutateOrder } from '@/lib/orderPermissions';
import { assertCanChangeFulfillment, assertCanChangeDelivery, assertCanSetException } from '@/lib/orderTransitions';
import type { AdminRole } from '@/lib/auth';
import type { DeliveryStatus, ExceptionStatus, FulfillmentStatus } from '@prisma/client';

async function getCurrentUser() {
  const session = await getServerSession();
  if (!session?.user) return null;
  return {
    id: session.user.id as string,
    role: session.user.role as AdminRole
  };
}

export async function assignBuyer(orderId: string, buyerUserId: string | null) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('Not authenticated.');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      assignedBuyerUserId: true
    }
  });
  if (!order) throw new Error('Order not found.');

  if (
    !canMutateOrder(currentUser.role, 'assignBuyer', order, currentUser.id)
  ) {
    throw new Error('You do not have permission to assign this order.');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { assignedBuyerUserId: buyerUserId }
  });

  await prisma.orderActivity.create({
    data: {
      orderId: orderId,
      actorUserId: currentUser.id,
      activityType: 'BUYER_ASSIGNED',
      details: {
        previousBuyerUserId: order.assignedBuyerUserId,
        newBuyerUserId: buyerUserId
      }
    }
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  return updated;
}

export async function setFulfillmentStatus(orderId: string, nextStatus: FulfillmentStatus) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated.');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      deliveryStatus: true,
      exceptionStatus: true,
      assignedBuyerUserId: true
    }
  });
  if (!order) throw new Error('Order not found.');

  if (!canMutateOrder(currentUser.role, 'setFulfillmentStatus', order, currentUser.id)) {
    throw new Error('You do not have permission to update fulfillment status.');
  }

  assertCanChangeFulfillment(order, nextStatus);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { fulfillmentStatus: nextStatus }
  });

  await prisma.orderActivity.create({
    data: {
      orderId,
      actorUserId: currentUser.id,
      activityType: 'FULFILLMENT_STATUS_CHANGED',
      details: {
        from: order.fulfillmentStatus,
        to: nextStatus
      }
    }
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  return updated;
}

export async function setDeliveryStatus(orderId: string, nextStatus: DeliveryStatus) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated.');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      deliveryStatus: true,
      exceptionStatus: true,
      assignedBuyerUserId: true
    }
  });
  if (!order) throw new Error('Order not found.');

  if (!canMutateOrder(currentUser.role, 'setDeliveryStatus', order, currentUser.id)) {
    throw new Error('You do not have permission to update delivery status.');
  }

  assertCanChangeDelivery(order, nextStatus);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { deliveryStatus: nextStatus }
  });

  await prisma.orderActivity.create({
    data: {
      orderId,
      actorUserId: currentUser.id,
      activityType: 'DELIVERY_STATUS_CHANGED',
      details: {
        from: order.deliveryStatus,
        to: nextStatus
      }
    }
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  return updated;
}

export async function setExceptionStatus(orderId: string, nextStatus: ExceptionStatus) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated.');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      deliveryStatus: true,
      exceptionStatus: true,
      assignedBuyerUserId: true
    }
  });
  if (!order) throw new Error('Order not found.');

  if (!canMutateOrder(currentUser.role, 'setExceptionStatus', order, currentUser.id)) {
    throw new Error('You do not have permission to update exception status.');
  }

  assertCanSetException(order, nextStatus);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { exceptionStatus: nextStatus }
  });

  await prisma.orderActivity.create({
    data: {
      orderId,
      actorUserId: currentUser.id,
      activityType: 'EXCEPTION_SET',
      details: {
        from: order.exceptionStatus,
        to: nextStatus
      }
    }
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  return updated;
}

export async function addInternalNote(orderId: string, note: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated.');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      deliveryStatus: true,
      exceptionStatus: true,
      assignedBuyerUserId: true,
      internalNotes: true
    }
  });
  if (!order) throw new Error('Order not found.');

  if (!canMutateOrder(currentUser.role, 'addNote', order, currentUser.id)) {
    throw new Error('You do not have permission to add notes.');
  }

  const combinedNotes =
    (order.internalNotes ? order.internalNotes + '\n' : '') +
    `[${new Date().toISOString()}] ${currentUser.id}: ${note}`;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { internalNotes: combinedNotes }
  });

  await prisma.orderActivity.create({
    data: {
      orderId,
      actorUserId: currentUser.id,
      activityType: 'NOTE_ADDED',
      details: {
        note
      }
    }
  });

  revalidatePath(`/admin/orders/${orderId}`);

  return updated;
}

