import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getServerSession, requireAdminRole } from '@/lib/auth';
import { assignBuyer, setFulfillmentStatus, setDeliveryStatus, setExceptionStatus, addInternalNote } from '@/lib/actions/admin-orders';

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session?.user) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      parentEvent: true,
      eventDate: true,
      zone: true,
      assignedBuyer: true,
      orderActivities: {
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, email: true } } }
      }
    }
  });

  if (!order) notFound();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="text-slate-400 hover:text-white">
          ← Orders
        </Link>
        <h2 className="text-lg font-semibold text-white">Order {order.orderNumber}</h2>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <h3 className="font-medium text-slate-200">Summary</h3>
          <p className="text-slate-300">
            {order.parentEvent.title} – {order.zone.zoneName}
          </p>
          <p className="text-slate-400">
            {order.eventDate.performanceAt.toLocaleString()} ({order.eventDate.timezone})
          </p>
          <p className="text-slate-400">
            {order.quantity} ticket(s) · {order.fulfillmentType}
          </p>
          <p className="text-slate-400">
            Seats together expected: {order.seatsTogetherExpected ? 'Yes' : 'No'}
          </p>
          <p className="text-slate-200 mt-2">
            Total: ${Number(order.totalAmount).toFixed(2)}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-medium text-slate-200">Customer</h3>
          <p className="text-slate-300">{order.customerName}</p>
          <p className="text-slate-400">{order.customerEmail}</p>
          {order.customerPhone && <p className="text-slate-400">{order.customerPhone}</p>}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 text-sm">
        <div className="space-y-2">
          <h3 className="font-medium text-slate-200">Statuses</h3>
          <p className="text-slate-400">Payment: {order.paymentStatus}</p>
          <form
            action={async (formData) => {
              'use server';
              const next = formData.get('fulfillmentStatus');
              if (typeof next === 'string' && next) {
                await setFulfillmentStatus(order.id, next as any);
              }
            }}
            className="space-y-1"
          >
            <label className="block text-xs text-slate-400">Fulfillment</label>
            <select
              name="fulfillmentStatus"
              defaultValue={order.fulfillmentStatus}
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"
            >
              {['NEW', 'IN_PROGRESS', 'ACQUIRED', 'DELIVERED', 'EXCEPTION', 'CANCELLED'].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
            <button
              type="submit"
              className="mt-1 rounded bg-slate-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-500"
            >
              Update fulfillment
            </button>
          </form>
          <form
            action={async (formData) => {
              'use server';
              const next = formData.get('deliveryStatus');
              if (typeof next === 'string' && next) {
                await setDeliveryStatus(order.id, next as any);
              }
            }}
            className="space-y-1"
          >
            <label className="block text-xs text-slate-400">Delivery</label>
            <select
              name="deliveryStatus"
              defaultValue={order.deliveryStatus}
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"
            >
              {['PENDING', 'SENT', 'DELIVERED', 'PICKUP_READY'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-1 rounded bg-slate-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-500"
            >
              Update delivery
            </button>
          </form>
          <form
            action={async (formData) => {
              'use server';
              const next = formData.get('exceptionStatus');
              if (typeof next === 'string') {
                await setExceptionStatus(order.id, next as any);
              }
            }}
            className="space-y-1"
          >
            <label className="block text-xs text-slate-400">Exception</label>
            <select
              name="exceptionStatus"
              defaultValue={order.exceptionStatus}
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"
            >
              {[
                'NONE',
                'TOGETHER_UNAVAILABLE',
                'PRICE_BREAK',
                'ZONE_UNAVAILABLE',
                'QTY_UNAVAILABLE',
                'FULFILLMENT_MISMATCH',
                'DELIVERY_ISSUE'
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-1 rounded bg-slate-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-500"
            >
              Update exception
            </button>
          </form>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-slate-200">Assignment</h3>
          <form
            action={async (formData) => {
              'use server';
              const newBuyerId = formData.get('assignedBuyerUserId');
              await assignBuyer(
                order.id,
                typeof newBuyerId === 'string' && newBuyerId !== '' ? newBuyerId : null
              );
            }}
            className="space-y-2"
          >
            <select
              name="assignedBuyerUserId"
              defaultValue={order.assignedBuyerUserId ?? ''}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-500"
            >
              Update buyer
            </button>
          </form>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-slate-200">Internal notes</h3>
          <form
            action={async (formData) => {
              'use server';
              const note = formData.get('note');
              if (typeof note === 'string' && note.trim()) {
                await addInternalNote(order.id, note.trim());
              }
            }}
            className="space-y-2"
          >
            <textarea
              name="note"
              rows={3}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white"
              placeholder="Add an internal note…"
            />
            <button
              type="submit"
              className="rounded bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-500"
            >
              Add note
            </button>
          </form>
          {order.internalNotes && (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-slate-700 bg-slate-900 p-2 text-[11px] text-slate-300">
              {order.internalNotes}
            </pre>
          )}
        </div>
      </section>

      <section className="space-y-3 text-sm">
        <h3 className="font-medium text-slate-200">Activity</h3>
        <div className="space-y-1">
          {order.orderActivities.length === 0 ? (
            <p className="text-slate-500 text-xs">No activity yet.</p>
          ) : (
            order.orderActivities.map((a) => (
              <div key={a.id} className="flex justify-between gap-4">
                <div className="text-slate-300">
                  <span className="mr-2 text-xs text-slate-500">
                    {a.createdAt.toLocaleString()}
                  </span>
                  <span className="font-medium">{a.activityType}</span>
                  {a.actor && (
                    <span className="ml-1 text-xs text-slate-500">by {a.actor.name}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

