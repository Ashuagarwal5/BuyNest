import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { cartReducer, getEntryQuantity, initialCartState } from '@/features/cart/cart-reducer';
import { loadCartEntries, saveCartEntries } from '@/features/cart/cart-storage';
import { ApiError } from '@/services/api/api-error';
import { fetchProduct } from '@/services/api/catalog-api';
import type { Product } from '@/types/catalog';
import { calculateLineTotal, calculateSubtotal } from '@/utils/pricing';

export type CartLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
  /** Why this line cannot be ordered as it stands, or null when it is fine. */
  issue: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  /** Total units across all lines, used for the tab badge. */
  itemCount: number;
  /** Estimate from last-known prices; the server calculates the real total. */
  subtotal: number;
  /** True when at least one line is unavailable or exceeds the stock last reported. */
  hasIssues: boolean;
  /** False until the saved cart has been read; the cart is usable (and empty) meanwhile. */
  isHydrated: boolean;
  getQuantity: (productId: string) => number;
  addItem: (product: Product, quantity?: number) => void;
  increment: (product: Product) => void;
  decrement: (product: Product) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  /** Clears the cart only if it still matches an order that was just placed from it. */
  clearIfMatches: (cartFingerprint: string) => void;
  /** Re-reads price and availability for everything in the cart from the server. */
  refreshProducts: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function getIssue(product: Product, quantity: number): string | null {
  if (product.stockQuantity <= 0) {
    return 'No longer available';
  }
  if (quantity > product.stockQuantity) {
    return `Only ${product.stockQuantity} available`;
  }
  return null;
}

export function CartProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [isHydrated, setIsHydrated] = useState(false);
  const isRefreshing = useRef(false);

  useEffect(() => {
    let isActive = true;
    loadCartEntries().then((entries) => {
      if (isActive) {
        dispatch({ type: 'hydrate', entries });
        setIsHydrated(true);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    // Saving before hydration would overwrite the stored cart with an empty one.
    if (isHydrated) {
      saveCartEntries(state.entries);
    }
  }, [isHydrated, state.entries]);

  const lines: CartLine[] = state.entries.map(({ product, quantity }) => ({
    product,
    quantity,
    lineTotal: calculateLineTotal(product.sellingPrice, quantity),
    issue: getIssue(product, quantity),
  }));

  const getQuantity = (productId: string) => getEntryQuantity(state, productId);

  const refreshProducts = async () => {
    if (isRefreshing.current || state.entries.length === 0) {
      return;
    }
    isRefreshing.current = true;

    const products: Product[] = [];
    const unavailableIds: string[] = [];
    await Promise.all(
      state.entries.map(async ({ product }) => {
        try {
          products.push(await fetchProduct(product.id));
        } catch (error) {
          // "Not found" is an answer: the product is gone. Any other failure (offline,
          // timeout) tells us nothing, so the last-known snapshot stays as it is.
          if (error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND') {
            unavailableIds.push(product.id);
          }
        }
      })
    );

    isRefreshing.current = false;
    if (products.length > 0 || unavailableIds.length > 0) {
      dispatch({ type: 'sync', products, unavailableIds });
    }
  };

  const value: CartContextValue = {
    lines,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    subtotal: calculateSubtotal(
      lines.map((line) => ({ unitPrice: line.product.sellingPrice, quantity: line.quantity }))
    ),
    hasIssues: lines.some((line) => line.issue !== null),
    isHydrated,
    getQuantity,
    addItem: (product, quantity = 1) => dispatch({ type: 'add', product, quantity }),
    increment: (product) => dispatch({ type: 'add', product, quantity: 1 }),
    decrement: (product) =>
      dispatch({
        type: 'setQuantity',
        productId: product.id,
        quantity: getQuantity(product.id) - 1,
      }),
    removeItem: (productId) => dispatch({ type: 'remove', productId }),
    clear: () => dispatch({ type: 'clear' }),
    clearIfMatches: (fingerprint) => dispatch({ type: 'clearIfMatches', fingerprint }),
    refreshProducts,
  };

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = use(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return context;
}
