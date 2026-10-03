/**
 * Thin JSON wrapper over AsyncStorage. It never throws: callers get a result they must
 * handle, so a storage failure can be shown to the customer instead of crashing the app.
 *
 * Only device-local state lives here (the cart, checkout convenience data and the
 * references needed to look orders up). Catalogue and order contents come from the API.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  /** Cart lines with a last-known product snapshot. v1 held mock product ids only. */
  cart: 'buynest:cart:v2',
  /** Order numbers and tracking tokens for orders placed from this device. */
  trackedOrders: 'buynest:tracked-orders:v1',
  /** The order submission that the server has not confirmed yet, with its full request. */
  pendingOrder: 'buynest:pending-order:v2',
  /** v1 kept only an id and a fingerprint, so it could not be replayed. Removed on load. */
  legacyPendingOrder: 'buynest:pending-order:v1',
  checkoutDetails: 'buynest:checkout-details:v1',
  /** Orders created on-device before the backend existed. Read-only; never sent anywhere. */
  legacyLocalOrders: 'buynest:orders:v1',
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** `value` is null when nothing is stored, or when what is stored is not valid JSON. */
export type StorageReadResult = { ok: true; value: unknown } | { ok: false };

// Keys only are logged below, never values: they hold tracking tokens and addresses.

export async function readJson(key: StorageKey): Promise<StorageReadResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    console.warn(`[storage] Could not read "${key}"`);
    return { ok: false };
  }

  if (raw === null) {
    return { ok: true, value: null };
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    console.warn(`[storage] Ignoring corrupted data in "${key}"`);
    return { ok: true, value: null };
  }
}

export async function writeJson(key: StorageKey, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.warn(`[storage] Could not write "${key}"`);
    return false;
  }
}

export async function removeItem(key: StorageKey): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    console.warn(`[storage] Could not remove "${key}"`);
    return false;
  }
}
