/**
 * Thin JSON wrapper over AsyncStorage. It never throws: callers get a result they must
 * handle, so a storage failure can be shown to the customer instead of crashing the app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  cart: 'buynest:cart:v1',
  orders: 'buynest:orders:v1',
  checkoutDetails: 'buynest:checkout-details:v1',
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/** `value` is null when nothing is stored, or when what is stored is not valid JSON. */
export type StorageReadResult = { ok: true; value: unknown } | { ok: false };

export async function readJson(key: StorageKey): Promise<StorageReadResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`[storage] Could not read "${key}"`, error);
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
  } catch (error) {
    console.warn(`[storage] Could not write "${key}"`, error);
    return false;
  }
}
