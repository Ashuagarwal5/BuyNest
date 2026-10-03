import type { CartEntry } from '@/features/cart/cart-reducer';
import { readJson, StorageKeys, writeJson } from '@/services/storage';
import type { Product } from '@/types/catalog';

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const product = value as Record<string, unknown>;
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.slug === 'string' &&
    typeof product.description === 'string' &&
    typeof product.categoryId === 'string' &&
    typeof product.categorySlug === 'string' &&
    typeof product.categoryName === 'string' &&
    Array.isArray(product.images) &&
    Number.isSafeInteger(product.mrp) &&
    Number.isSafeInteger(product.sellingPrice) &&
    Number.isSafeInteger(product.stockQuantity)
  );
}

function isCartEntry(value: unknown): value is CartEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    isProduct(entry.product) &&
    typeof entry.quantity === 'number' &&
    Number.isInteger(entry.quantity) &&
    entry.quantity > 0
  );
}

/**
 * The saved cart. Damaged lines are dropped, and a missing, unreadable or corrupted cart
 * is simply empty. Product details in it may be out of date; the cart refreshes them
 * from the server when it is opened.
 */
export async function loadCartEntries(): Promise<CartEntry[]> {
  const result = await readJson(StorageKeys.cart);
  if (!result.ok || !Array.isArray(result.value)) {
    return [];
  }
  return result.value.filter(isCartEntry);
}

export function saveCartEntries(entries: CartEntry[]): Promise<boolean> {
  return writeJson(StorageKeys.cart, entries);
}
