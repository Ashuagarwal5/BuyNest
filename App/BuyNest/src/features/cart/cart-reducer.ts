import { fingerprintCartItems } from '@/features/cart/cart-fingerprint';
import type { Product } from '@/types/catalog';

/**
 * A cart line keeps the product as the server last described it. That snapshot is only
 * for showing the cart; it can be stale, and the server re-prices and re-checks stock
 * when the order is placed.
 */
export type CartEntry = {
  product: Product;
  quantity: number;
};

export type CartState = {
  entries: CartEntry[];
};

export type CartAction =
  | { type: 'add'; product: Product; quantity: number }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' }
  /** Clears the cart only if it still holds exactly what `fingerprint` describes. */
  | { type: 'clearIfMatches'; fingerprint: string }
  | { type: 'hydrate'; entries: CartEntry[] }
  /** Fresh server data for products in the cart; `unavailableIds` no longer exist or are inactive. */
  | { type: 'sync'; products: Product[]; unavailableIds: string[] };

export const initialCartState: CartState = { entries: [] };

function withoutEntry(state: CartState, productId: string): CartState {
  return { entries: state.entries.filter((entry) => entry.product.id !== productId) };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const current = getEntryQuantity(state, product.id);
      // Never above the stock the server last reported for this product.
      const quantity = Math.min(current + Math.max(action.quantity, 0), product.stockQuantity);
      if (quantity <= 0) {
        return state;
      }
      if (current === 0) {
        return { entries: [...state.entries, { product, quantity }] };
      }
      return {
        entries: state.entries.map((entry) =>
          entry.product.id === product.id ? { product, quantity } : entry
        ),
      };
    }
    case 'setQuantity': {
      const entry = state.entries.find((candidate) => candidate.product.id === action.productId);
      if (!entry) {
        return state;
      }
      const quantity = Math.min(action.quantity, entry.product.stockQuantity);
      if (quantity <= 0) {
        return withoutEntry(state, action.productId);
      }
      return {
        entries: state.entries.map((candidate) =>
          candidate === entry ? { ...candidate, quantity } : candidate
        ),
      };
    }
    case 'remove':
      return withoutEntry(state, action.productId);
    case 'clear':
      return initialCartState;
    case 'clearIfMatches': {
      // Decided against the cart as it is NOW, not as it was when the order was sent: the
      // customer may have changed it since, and a newer cart must never be erased.
      const current = fingerprintCartItems(
        state.entries.map((entry) => ({ productId: entry.product.id, quantity: entry.quantity }))
      );
      return current === action.fingerprint ? initialCartState : state;
    }
    case 'hydrate': {
      // Anything added while storage was still loading wins over the saved copy.
      const current = new Set(state.entries.map((entry) => entry.product.id));
      const restored = action.entries.filter((entry) => !current.has(entry.product.id));
      return restored.length === 0 ? state : { entries: [...restored, ...state.entries] };
    }
    case 'sync': {
      const fresh = new Map(action.products.map((product) => [product.id, product]));
      const unavailable = new Set(action.unavailableIds);
      return {
        // Quantities are left alone: the cart shows what needs attention instead of
        // silently changing what the customer chose.
        entries: state.entries.map((entry) => {
          if (unavailable.has(entry.product.id)) {
            return { ...entry, product: { ...entry.product, stockQuantity: 0 } };
          }
          const product = fresh.get(entry.product.id);
          return product ? { ...entry, product } : entry;
        }),
      };
    }
  }
}

export function getEntryQuantity(state: CartState, productId: string): number {
  return state.entries.find((entry) => entry.product.id === productId)?.quantity ?? 0;
}
