import type { ThemeColor } from '@/constants/theme';
import type { Product } from '@/types/catalog';

/** "Only 4 left" shows at or below this many units. */
export const LOW_STOCK_AT = 5;

/**
 * Units the shop can deliver from its shelf now. It equals `stockQuantity` unless the product
 * takes backorders, when more can be ordered than are in stock. Carts saved before the server
 * sent `readyQuantity` fall back to `stockQuantity`.
 */
export function getReadyQuantity(product: Product): number {
  return Math.min(product.readyQuantity ?? product.stockQuantity, product.stockQuantity);
}

/** How many of `quantity` units wait for the shop to restock before they can be delivered. */
export function getUnitsAwaitingRestock(product: Product, quantity: number): number {
  return Math.max(0, quantity - getReadyQuantity(product));
}

/** The short stock line shown on cards and the product screen. */
export function getStockStatus(product: Product): { label: string; color: ThemeColor } {
  const ready = getReadyQuantity(product);
  const takesBackorders = product.stockQuantity > ready;
  if (product.stockQuantity <= 0) {
    return { label: 'Out of stock', color: 'danger' };
  }
  if (ready <= 0) {
    return { label: 'Ships after restock', color: 'accent' };
  }
  if (ready <= LOW_STOCK_AT) {
    return { label: takesBackorders ? `Only ${ready} ready now` : `Only ${ready} left`, color: 'accent' };
  }
  return { label: 'In stock', color: 'success' };
}

/**
 * Said under a cart line or quantity picker when part of `quantity` waits for a restock, else
 * null. `alreadyInCart` units are counted first, since they take the ready stock before these.
 */
export function describeRestockWait(product: Product, quantity: number, alreadyInCart = 0): string | null {
  const waiting = Math.min(quantity, getUnitsAwaitingRestock(product, alreadyInCart + quantity));
  if (waiting === 0) return null;
  return waiting === quantity
    ? 'Ships after restock. We deliver once it is back in stock.'
    : `${waiting} of ${quantity} ship after restock. We deliver once it is back in stock.`;
}
