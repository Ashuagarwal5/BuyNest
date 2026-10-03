import { getProductById } from '@/data/products';
import type { CartEntry } from '@/features/cart/cart-reducer';
import { readJson, StorageKeys, writeJson } from '@/services/storage';

function isCartEntry(value: unknown): value is CartEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.productId === 'string' &&
    typeof entry.quantity === 'number' &&
    Number.isInteger(entry.quantity) &&
    entry.quantity > 0
  );
}

/**
 * Saved cart, cleaned against the current catalogue: unknown products are dropped and
 * quantities are capped at stock. A missing, unreadable or corrupted cart is just empty.
 */
export async function loadCartEntries(): Promise<CartEntry[]> {
  const result = await readJson(StorageKeys.cart);
  if (!result.ok || !Array.isArray(result.value)) {
    return [];
  }

  const entries: CartEntry[] = [];
  for (const entry of result.value.filter(isCartEntry)) {
    const product = getProductById(entry.productId);
    const quantity = Math.min(entry.quantity, product?.stockQuantity ?? 0);
    if (quantity > 0) {
      entries.push({ productId: entry.productId, quantity });
    }
  }
  return entries;
}

export function saveCartEntries(entries: CartEntry[]): Promise<boolean> {
  return writeJson(StorageKeys.cart, entries);
}
