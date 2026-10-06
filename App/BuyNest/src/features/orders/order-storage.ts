/**
 * The device's index of orders: order numbers and tracking tokens only. It records how
 * to fetch an order, never what the order contains; contents always come from the server.
 * No name, phone number or address is stored here.
 *
 * Without customer login there is no "my orders" API, so this index is the only link
 * between this device and its orders. Losing it (clearing app data, reinstalling) means
 * the orders still exist at the shop but can no longer be opened from this app.
 *
 * Stored as { version, orders }. Version 1 of this key briefly held a bare array; that is
 * still read, and rewritten in the current shape the next time the index is saved.
 */

import { readJson, removeItem, StorageKeys, writeJson } from '@/services/storage';
import type { TrackedOrder } from '@/types/order';

const SCHEMA_VERSION = 1;

/** The server's order number format: DK-YYYYMMDD-NNNN (BN- for orders placed before the rename). */
const ORDER_NUMBER_PATTERN = /^(DK|BN)-\d{8}-\d{4,}$/;

function isTrackedOrder(value: unknown): value is TrackedOrder {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const tracked = value as Record<string, unknown>;
  return (
    typeof tracked.orderNumber === 'string' &&
    ORDER_NUMBER_PATTERN.test(tracked.orderNumber) &&
    // A missing token makes the entry useless: the server would refuse every request.
    typeof tracked.trackingToken === 'string' &&
    tracked.trackingToken.length > 0 &&
    typeof tracked.createdAt === 'string' &&
    !Number.isNaN(new Date(tracked.createdAt).getTime())
  );
}

/** Newest first, one entry per order number (the first one seen wins). */
export function normalizeTrackedOrders(entries: unknown[]): TrackedOrder[] {
  const seen = new Set<string>();
  const valid: TrackedOrder[] = [];
  for (const entry of entries) {
    if (isTrackedOrder(entry) && !seen.has(entry.orderNumber)) {
      seen.add(entry.orderNumber);
      valid.push({
        orderNumber: entry.orderNumber,
        trackingToken: entry.trackingToken,
        createdAt: entry.createdAt,
      });
    }
  }
  return valid.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type LoadTrackedOrdersResult = { ok: true; tracked: TrackedOrder[] } | { ok: false };

export async function loadTrackedOrders(): Promise<LoadTrackedOrdersResult> {
  const result = await readJson(StorageKeys.trackedOrders);
  if (!result.ok) {
    return { ok: false };
  }

  let stored: unknown[] = [];
  if (Array.isArray(result.value)) {
    stored = result.value;
  } else if (typeof result.value === 'object' && result.value !== null) {
    const { orders } = result.value as { orders?: unknown };
    stored = Array.isArray(orders) ? orders : [];
  }
  return { ok: true, tracked: normalizeTrackedOrders(stored) };
}

export function saveTrackedOrders(tracked: TrackedOrder[]): Promise<boolean> {
  return writeJson(StorageKeys.trackedOrders, {
    version: SCHEMA_VERSION,
    orders: normalizeTrackedOrders(tracked),
  });
}

/**
 * Orders the app created on-device before the backend existed. They were never sent to
 * the shop and have no tracking token, so they are not treated as real orders. They are
 * left in storage untouched until the customer chooses to remove them.
 */
export async function countLegacyLocalOrders(): Promise<number> {
  const result = await readJson(StorageKeys.legacyLocalOrders);
  return result.ok && Array.isArray(result.value) ? result.value.length : 0;
}

export function clearLegacyLocalOrders(): Promise<boolean> {
  return removeItem(StorageKeys.legacyLocalOrders);
}
