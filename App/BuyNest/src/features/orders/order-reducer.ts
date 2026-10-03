import type { PendingOrderAttempt } from '@/features/orders/pending-order';
import type { ApiError } from '@/services/api/api-error';
import type { Order, TrackedOrder } from '@/types/order';

/** What the app currently knows about one tracked order. */
export type OrderDetail = {
  /** Last copy received from the server, if any. */
  order?: Order;
  /** Why the most recent fetch failed, if it did. */
  error?: ApiError;
  isLoading: boolean;
};

export type OrdersState = {
  /** Whether the device's order index has been read. `error` means it could not be. */
  index: 'loading' | 'ready' | 'error';
  /** Newest first. */
  tracked: TrackedOrder[];
  /** Server data per order number. In memory only: it is re-fetched, never persisted. */
  details: Record<string, OrderDetail>;
  legacyLocalOrderCount: number;
  /** Whether the unconfirmed-order record has been read from the device. */
  pendingReady: boolean;
  /** An order submission the server has not confirmed. While set, no other order is sent. */
  pending: PendingOrderAttempt | null;
  /** True while an order request is on the wire. */
  isSubmitting: boolean;
};

export type OrdersAction =
  | { type: 'indexLoading' }
  | { type: 'indexLoaded'; tracked: TrackedOrder[]; legacyLocalOrderCount: number }
  | { type: 'indexFailed' }
  | { type: 'orderTracked'; tracked: TrackedOrder[]; order: Order }
  | { type: 'orderLoading'; orderNumber: string }
  | { type: 'orderLoaded'; order: Order }
  | { type: 'orderFailed'; orderNumber: string; error: ApiError }
  | { type: 'legacyCleared' }
  | { type: 'pendingLoaded'; pending: PendingOrderAttempt | null }
  | { type: 'pendingChanged'; pending: PendingOrderAttempt | null }
  | { type: 'submitting'; value: boolean };

export const initialOrdersState: OrdersState = {
  index: 'loading',
  tracked: [],
  details: {},
  legacyLocalOrderCount: 0,
  pendingReady: false,
  pending: null,
  isSubmitting: false,
};

function withDetail(state: OrdersState, orderNumber: string, detail: OrderDetail): OrdersState {
  return { ...state, details: { ...state.details, [orderNumber]: detail } };
}

export function ordersReducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case 'indexLoading':
      return { ...state, index: 'loading' };
    case 'indexLoaded':
      return {
        ...state,
        index: 'ready',
        tracked: action.tracked,
        legacyLocalOrderCount: action.legacyLocalOrderCount,
      };
    case 'indexFailed':
      return { ...state, index: 'error' };
    case 'orderTracked':
      return withDetail(
        { ...state, index: 'ready', tracked: action.tracked },
        action.order.orderNumber,
        { order: action.order, isLoading: false }
      );
    case 'orderLoading':
      // Keep the copy already on screen while a newer one is fetched.
      return withDetail(state, action.orderNumber, {
        order: state.details[action.orderNumber]?.order,
        isLoading: true,
      });
    case 'orderLoaded':
      return withDetail(state, action.order.orderNumber, { order: action.order, isLoading: false });
    case 'orderFailed':
      return withDetail(state, action.orderNumber, {
        order: state.details[action.orderNumber]?.order,
        error: action.error,
        isLoading: false,
      });
    case 'legacyCleared':
      return { ...state, legacyLocalOrderCount: 0 };
    case 'pendingLoaded':
    case 'pendingChanged':
      return { ...state, pendingReady: true, pending: action.pending };
    case 'submitting':
      return { ...state, isSubmitting: action.value };
  }
}
