export type CartEntry = {
  productId: string;
  quantity: number;
};

export type CartState = {
  entries: CartEntry[];
};

/** `stock` is the product's available quantity; the reducer never lets a line exceed it. */
export type CartAction =
  | { type: 'add'; productId: string; quantity: number; stock: number }
  | { type: 'setQuantity'; productId: string; quantity: number; stock: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' }
  | { type: 'hydrate'; entries: CartEntry[] };

export const initialCartState: CartState = { entries: [] };

function withQuantity(state: CartState, productId: string, quantity: number): CartState {
  if (quantity <= 0) {
    return { entries: state.entries.filter((entry) => entry.productId !== productId) };
  }

  const exists = state.entries.some((entry) => entry.productId === productId);
  if (!exists) {
    return { entries: [...state.entries, { productId, quantity }] };
  }

  return {
    entries: state.entries.map((entry) =>
      entry.productId === productId ? { ...entry, quantity } : entry
    ),
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const current = getEntryQuantity(state, action.productId);
      const next = Math.min(current + Math.max(action.quantity, 0), action.stock);
      return next === current ? state : withQuantity(state, action.productId, next);
    }
    case 'setQuantity':
      return withQuantity(state, action.productId, Math.min(action.quantity, action.stock));
    case 'remove':
      return withQuantity(state, action.productId, 0);
    case 'clear':
      return initialCartState;
    case 'hydrate': {
      // Anything added while storage was still loading wins over the saved copy.
      const current = new Set(state.entries.map((entry) => entry.productId));
      const restored = action.entries.filter((entry) => !current.has(entry.productId));
      return restored.length === 0 ? state : { entries: [...restored, ...state.entries] };
    }
  }
}

export function getEntryQuantity(state: CartState, productId: string): number {
  return state.entries.find((entry) => entry.productId === productId)?.quantity ?? 0;
}
