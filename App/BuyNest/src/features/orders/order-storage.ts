import { readJson, StorageKeys, writeJson } from '@/services/storage';
import type { Order, OrderStatus, PaymentStatus } from '@/types/order';

const ORDER_STATUSES: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'DELIVERY_FAILED',
];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'COLLECTED', 'REFUNDED'];

/** Checks the fields the screens rely on, so one damaged record cannot crash the app. */
function isOrder(value: unknown): value is Order {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const order = value as Record<string, unknown>;
  return (
    typeof order.id === 'string' &&
    typeof order.orderNumber === 'string' &&
    typeof order.customerName === 'string' &&
    typeof order.customerPhone === 'string' &&
    typeof order.deliveryAddress === 'object' &&
    order.deliveryAddress !== null &&
    Array.isArray(order.items) &&
    typeof order.subtotal === 'number' &&
    typeof order.deliveryCharge === 'number' &&
    typeof order.discount === 'number' &&
    typeof order.grandTotal === 'number' &&
    typeof order.createdAt === 'string' &&
    ORDER_STATUSES.includes(order.orderStatus as OrderStatus) &&
    PAYMENT_STATUSES.includes(order.paymentStatus as PaymentStatus)
  );
}

export type LoadOrdersResult = { ok: true; orders: Order[] } | { ok: false };

/** Saved orders, newest first. Damaged records are skipped; a failed read is reported. */
export async function loadOrders(): Promise<LoadOrdersResult> {
  const result = await readJson(StorageKeys.orders);
  if (!result.ok) {
    return { ok: false };
  }

  const stored = Array.isArray(result.value) ? result.value : [];
  const orders = stored
    .filter(isOrder)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ok: true, orders };
}

export function saveOrders(orders: Order[]): Promise<boolean> {
  return writeJson(StorageKeys.orders, orders);
}
