import Link from 'next/link';
import { prisma } from '@/lib/db';

export default async function AdminQueuePage() {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: 'PAID',
      fulfillmentStatus: {
        in: ['NEW', 'IN_PROGRESS', 'ACQUIRED', 'EXCEPTION']
      }
    },
    orderBy: {
      eventDate: { performanceAt: 'asc' }
    },
    include: {
      parentEvent: { select: { title: true } },
      eventDate: { select: { performanceAt: true, timezone: true } },
      zone: { select: { zoneName: true } },
      assignedBuyer: { select: { name: true } }
    }
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Fulfillment Queue</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/50">
            <tr>
              <th className="px-3 py-2 text-slate-300">Order #</th>
              <th className="px-3 py-2 text-slate-300">Event</th>
              <th className="px-3 py-2 text-slate-300">Date</th>
              <th className="px-3 py-2 text-slate-300">Zone</th>
              <th className="px-3 py-2 text-slate-300">Qty</th>
              <th className="px-3 py-2 text-slate-300">Buyer</th>
              <th className="px-3 py-2 text-slate-300">Fulfillment</th>
              <th className="px-3 py-2 text-slate-300">Delivery</th>
              <th className="px-3 py-2 text-slate-300">Exception</th>
              <th className="px-3 py-2 text-slate-300">Total</th>
              <th className="px-3 py-2 text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-4 text-center text-slate-500">
                  No orders in fulfillment queue.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-2 text-slate-200">{o.orderNumber}</td>
                  <td className="px-3 py-2 text-slate-200">{o.parentEvent.title}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {o.eventDate.performanceAt.toLocaleString()} ({o.eventDate.timezone})
                  </td>
                  <td className="px-3 py-2 text-slate-200">{o.zone.zoneName}</td>
                  <td className="px-3 py-2 text-slate-200">{o.quantity}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {o.assignedBuyer?.name ?? 'Unassigned'}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{o.fulfillmentStatus}</td>
                  <td className="px-3 py-2 text-slate-400">{o.deliveryStatus}</td>
                  <td className="px-3 py-2 text-slate-400">{o.exceptionStatus}</td>
                  <td className="px-3 py-2 text-slate-200">
                    ${Number(o.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-xs text-slate-300 hover:text-white underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
