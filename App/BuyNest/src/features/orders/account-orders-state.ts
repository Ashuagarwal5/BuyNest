import type { ApiError } from '../../services/api/api-error';
import type { Order } from '../../types/order';

type OrderDetail = { order?: Order; error?: ApiError; isLoading: boolean };

export type AccountOrdersState = {
  sessionKey: string | null;
  requestId: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: Order[];
  details: Record<string, OrderDetail>;
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
  error?: ApiError;
};

export const emptyAccountOrders: AccountOrdersState = {
  sessionKey: null, requestId: 0, status: 'idle', items: [], details: {},
  page: 0, hasMore: false, loadingMore: false,
};

type Action =
  | { type: 'reset' }
  | { type: 'start'; sessionKey: string; requestId: number; page: number }
  | { type: 'loaded'; sessionKey: string; requestId: number; items: Order[]; page: number; hasMore: boolean }
  | { type: 'failed'; sessionKey: string; requestId: number; error: ApiError }
  | { type: 'detailLoading'; sessionKey: string; orderNumber: string }
  | { type: 'detailLoaded'; sessionKey: string; order: Order }
  | { type: 'detailFailed'; sessionKey: string; orderNumber: string; error: ApiError };

/** Session-scoped cache: late responses from a previous login are ignored. */
export function accountOrdersReducer(state: AccountOrdersState, action: Action): AccountOrdersState {
  if (action.type === 'reset') return emptyAccountOrders;
  if (action.type === 'start') {
    const base = state.sessionKey === action.sessionKey ? state : emptyAccountOrders;
    return { ...base, sessionKey: action.sessionKey, requestId: action.requestId,
      status: base.items.length ? 'ready' : 'loading', loadingMore: action.page > 1, error: undefined };
  }
  if (state.sessionKey !== action.sessionKey) return state;
  if (state.error?.code === 'UNAUTHENTICATED' &&
      (action.type === 'loaded' || action.type === 'detailLoaded' || action.type === 'detailLoading')) return state;
  if ((action.type === 'loaded' || action.type === 'failed') && state.requestId !== action.requestId) return state;
  if (action.type === 'failed' || action.type === 'detailFailed') {
    if (action.error.code === 'UNAUTHENTICATED') {
      return { ...state, items: [], details: {}, hasMore: false, loadingMore: false, status: 'error', error: action.error };
    }
    if (action.type === 'failed') return { ...state, status: 'error', loadingMore: false, error: action.error };
    return { ...state, details: { ...state.details, [action.orderNumber]: {
      order: state.details[action.orderNumber]?.order, isLoading: false, error: action.error,
    } } };
  }
  if (action.type === 'detailLoading') {
    return { ...state, details: { ...state.details, [action.orderNumber]: {
      order: state.details[action.orderNumber]?.order, isLoading: true,
    } } };
  }
  if (action.type === 'detailLoaded') {
    const items = state.items.some((order) => order.orderNumber === action.order.orderNumber)
      ? state.items.map((order) => order.orderNumber === action.order.orderNumber ? action.order : order)
      : [action.order, ...state.items];
    return { ...state, items, details: { ...state.details, [action.order.orderNumber]: { order: action.order, isLoading: false } } };
  }
  const items = action.page === 1 ? action.items : [
    ...state.items, ...action.items.filter((order) => !state.items.some((item) => item.orderNumber === order.orderNumber)),
  ];
  const details = { ...state.details };
  for (const order of action.items) details[order.orderNumber] = { order, isLoading: false };
  return { ...state, items, details, page: action.page, hasMore: action.hasMore,
    status: 'ready', loadingMore: false, error: undefined };
}
