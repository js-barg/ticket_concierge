import { prisma } from './db';

export type GeneratedReportRow = {
  orderNumber: string;
  createdAt: Date;
  eventTitle: string;
  eventDateTime: Date;
  zoneName: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  fulfillmentType: string;
  assignedBuyer: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  exceptionStatus: string;
  sourceCostEstimateTotal: number;
  totalAmount: number;
  internalNotesSummary: string | null;
};

export type GeneratedReport = {
  id: string;
  reportDate: Date;
  buyerId?: string;
  rows: GeneratedReportRow[];
  createdAt: Date;
};

/**
 * Build start (inclusive) and end (exclusive) for a calendar day in UTC
 * so the same report date always yields the same range regardless of server timezone.
 */
function getUtcDayRange(reportDate: Date): { start: Date; end: Date } {
  const y = reportDate.getUTCFullYear();
  const m = reportDate.getUTCMonth();
  const d = reportDate.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
  return { start, end };
}

const orderInclude = {
  parentEvent: { select: { title: true } },
  eventDate: { select: { performanceAt: true } },
  zone: { select: { zoneName: true, fulfillmentType: true } },
  assignedBuyer: { select: { name: true } }
} as const;

type OrderWithRelations = Awaited<
  ReturnType<typeof prisma.order.findMany<{ include: typeof orderInclude }>>
>[number];

/** Deduplicate by orderNumber (keep first by createdAt) so legacy duplicate rows show once. */
function dedupeByOrderNumber<T extends { orderNumber: string; createdAt: Date }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((o) => {
    if (seen.has(o.orderNumber)) return false;
    seen.add(o.orderNumber);
    return true;
  });
}

function mapOrdersToRows(orders: OrderWithRelations[]): GeneratedReportRow[] {
  return orders.map((o) => ({
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    eventTitle: o.parentEvent.title,
    eventDateTime: o.eventDate.performanceAt,
    zoneName: o.zone.zoneName,
    quantity: o.quantity,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    fulfillmentType: o.zone.fulfillmentType,
    assignedBuyer: o.assignedBuyer?.name ?? null,
    paymentStatus: o.paymentStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    exceptionStatus: o.exceptionStatus,
    sourceCostEstimateTotal: Number(o.sourceCostEstimateTotal),
    totalAmount: Number(o.totalAmount),
    internalNotesSummary: o.internalNotes
      ? o.internalNotes.length > 160
        ? o.internalNotes.slice(0, 157) + '...'
        : o.internalNotes
      : null
  }));
}

/**
 * Fetch order rows for a report date (no DB write).
 * Use this for CSV export so we don't create duplicate DailyReport records.
 */
export async function getReportDataForDate(
  reportDate: Date,
  opts?: { buyerId?: string }
): Promise<{ reportDate: Date; rows: GeneratedReportRow[] }> {
  const { start, end } = getUtcDayRange(reportDate);
  const where: any = {
    createdAt: {
      gte: start,
      lt: end
    }
  };
  if (opts?.buyerId) {
    where.assignedBuyerUserId = opts.buyerId;
  }
  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'asc' }
  });
  const deduped = dedupeByOrderNumber(orders);
  return { reportDate: start, rows: mapOrdersToRows(deduped) };
}

/**
 * Fetch order rows for a date range (inclusive of both from and to, in UTC).
 * Use for "date range" export; does not create a DailyReport record.
 */
export async function getReportDataForDateRange(
  fromDate: Date,
  toDate: Date
): Promise<{ rows: GeneratedReportRow[] }> {
  const { start } = getUtcDayRange(fromDate);
  const { end } = getUtcDayRange(toDate);
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lt: end }
    },
    include: orderInclude,
    orderBy: { createdAt: 'asc' }
  });
  const deduped = dedupeByOrderNumber(orders);
  return { rows: mapOrdersToRows(deduped) };
}

/**
 * Fetch all orders that are not yet fulfilled (not DELIVERED or CANCELLED).
 * Use for "unfulfilled orders" export; does not create a DailyReport record.
 */
export async function getReportDataForUnfulfilled(): Promise<{
  rows: GeneratedReportRow[];
}> {
  const orders = await prisma.order.findMany({
    where: {
      fulfillmentStatus: {
        notIn: ['DELIVERED', 'CANCELLED']
      }
    },
    include: orderInclude,
    orderBy: { createdAt: 'asc' }
  });
  const deduped = dedupeByOrderNumber(orders);
  return { rows: mapOrdersToRows(deduped) };
}

export async function generateDailyReport(
  reportDate: Date,
  opts?: { buyerId?: string }
): Promise<GeneratedReport> {
  const { start, end } = getUtcDayRange(reportDate);

  const where: any = {
    createdAt: {
      gte: start,
      lt: end
    }
  };

  if (opts?.buyerId) {
    where.assignedBuyerUserId = opts.buyerId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'asc' }
  });
  const rows = mapOrdersToRows(orders);

  const recipientEmail =
    opts?.buyerId != null
      ? ''
      : ''; // can be populated from current user or config later

  const daily = await prisma.dailyReport.create({
    data: {
      reportDate: new Date(start),
      recipientUserId: null,
      recipientEmail: recipientEmail || 'dev@example.com',
      fileUrl: null,
      status: 'GENERATED'
    }
  });

  return {
    id: daily.id,
    reportDate: daily.reportDate,
    buyerId: opts?.buyerId,
    rows,
    createdAt: daily.createdAt
  };
}

const REPORT_CSV_HEADER = [
  'orderNumber',
  'createdAt',
  'eventTitle',
  'eventDateTime',
  'zoneName',
  'quantity',
  'customerName',
  'customerEmail',
  'fulfillmentType',
  'assignedBuyer',
  'paymentStatus',
  'fulfillmentStatus',
  'exceptionStatus',
  'sourceCostEstimateTotal',
  'totalAmount',
  'internalNotesSummary'
];

function escapeCsvValue(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  const escaped = s.replace(/"/g, '""');
  if (/[",\n\r]/.test(escaped)) return `"${escaped}"`;
  return escaped;
}

function rowToCsvLine(row: GeneratedReportRow): string {
  return [
    row.orderNumber,
    row.createdAt.toISOString(),
    row.eventTitle,
    row.eventDateTime.toISOString(),
    row.zoneName,
    row.quantity,
    row.customerName,
    row.customerEmail,
    row.fulfillmentType,
    row.assignedBuyer ?? '',
    row.paymentStatus,
    row.fulfillmentStatus,
    row.exceptionStatus,
    row.sourceCostEstimateTotal.toFixed(2),
    row.totalAmount.toFixed(2),
    row.internalNotesSummary ?? ''
  ]
    .map(escapeCsvValue)
    .join(',');
}

/** Serialize report rows to CSV (for export without a DailyReport record). */
export function serializeRowsToCsv(rows: GeneratedReportRow[]): string {
  const lines = [REPORT_CSV_HEADER.join(','), ...rows.map(rowToCsvLine)];
  return lines.join('\r\n');
}

export function serializeReportToCsv(report: GeneratedReport): string {
  return serializeRowsToCsv(report.rows);
}

