import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useReducer,
  useState,
} from 'react';

import { getProductById } from '@/data/products';
import { cartReducer, getEntryQuantity, initialCartState } from '@/features/cart/cart-reducer';
import { loadCartEntries, saveCartEntries } from '@/features/cart/cart-storage';
import type { Product } from '@/types/catalog';
import { calculateLineTotal, calculateSubtotal } from '@/utils/pricing';

export type CartLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

type CartContextValue = {
  lines: CartLine[];
  /** Total units across all lines, used for the tab badge. */
  itemCount: number;
  subtotal: number;
  /** False until the saved cart has been read; the cart is usable (and empty) meanwhile. */
  isHydrated: boolean;
  getQuantity: (productId: string) => number;
  addItem: (product: Product, quantity?: number) => void;
  increment: (product: Product) => void;
  decrement: (product: Product) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const lines: CartLine[] = [];
  for (const entry of state.entries) {
    const product = getProductById(entry.productId);
    if (product) {
      lines.push({
        product,
        quantity: entry.quantity,
        lineTotal: calculateLineTotal(product.sellingPrice, entry.quantity),
      });
    }
  }

  const getQuantity = (productId: string) => getEntryQuantity(state, productId);

  const value: CartContextValue = {
    lines,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
    subtotal: calculateSubtotal(
      lines.map((line) => ({ unitPrice: line.product.sellingPrice, quantity: line.quantity }))
    ),
    isHydrated,
    getQuantity,
    addItem: (product, quantity = 1) =>
      dispatch({ type: 'add', productId: product.id, quantity, stock: product.stockQuantity }),
    increment: (product) =>
      dispatch({ type: 'add', productId: product.id, quantity: 1, stock: product.stockQuantity }),
    decrement: (product) =>
      dispatch({
        type: 'setQuantity',
        productId: product.id,
        quantity: getQuantity(product.id) - 1,
        stock: product.stockQuantity,
      }),
    removeItem: (productId) => dispatch({ type: 'remove', productId }),
    clear: () => dispatch({ type: 'clear' }),
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
