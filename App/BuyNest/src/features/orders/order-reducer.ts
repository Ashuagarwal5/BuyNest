import type { Order } from '@/types/order';

export type OrdersState = {
  /** `error` means the saved orders could not be read; `orders` is empty in that case. */
  status: 'loading' | 'ready' | 'error';
  /** Newest first. */
  orders: Order[];
};

export type OrdersAction =
  | { type: 'loading' }
  | { type: 'loaded'; orders: Order[] }
  | { type: 'loadFailed' };

export const initialOrdersState: OrdersState = { status: 'loading', orders: [] };

export function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case 'loading':
      return { ...state, status: 'loading' };
    case 'loaded':
      return { status: 'ready', orders: action.orders };
    case 'loadFailed':
      return { status: 'error', orders: [] };
  }
}
