import { createContext, type PropsWithChildren, use, useEffect, useReducer } from 'react';

import { initialOrdersState, ordersReducer, type OrdersState } from '@/features/orders/order-reducer';
import {
  buildOrder,
  type BuildOrderResult,
  canCancelOrder,
  type OrderDraft,
} from '@/features/orders/order-service';
import { loadOrders, saveOrders } from '@/features/orders/order-storage';
import type { Order } from '@/types/order';

export type CancelOrderResult = { ok: true } | { ok: false; message: string };

type OrdersContextValue = {
  orders: Order[];
  status: OrdersState['status'];
  getOrderById: (id: string) => Order | undefined;
  reload: () => Promise<void>;
  placeOrder: (draft: OrderDraft) => Promise<BuildOrderResult>;
  cancelOrder: (id: string) => Promise<CancelOrderResult>;
};

const READ_FAILED = 'We could not read your saved orders. Please try again.';
const WRITE_FAILED = 'We could not save your order on this device. Please try again.';

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * Local stand-in for the orders API. Device storage is the source of truth: every change
 * re-reads it, writes the new list, and only then updates what the screens see.
 */
export function OrdersProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(ordersReducer, initialOrdersState);

  const refresh = async () => {
    const result = await loadOrders();
    dispatch(result.ok ? { type: 'loaded', orders: result.orders } : { type: 'loadFailed' });
  };

  useEffect(() => {
    let isActive = true;
    loadOrders().then((result) => {
      if (isActive) {
        dispatch(result.ok ? { type: 'loaded', orders: result.orders } : { type: 'loadFailed' });
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  const value: OrdersContextValue = {
    orders: state.orders,
    status: state.status,
    getOrderById: (id) => state.orders.find((order) => order.id === id),
    reload: async () => {
      dispatch({ type: 'loading' });
      await refresh();
    },
    placeOrder: async (draft) => {
      const stored = await loadOrders();
      if (!stored.ok) {
        return { ok: false, message: READ_FAILED };
      }

      const result = buildOrder(draft, stored.orders, new Date());
      if (!result.ok) {
        return result;
      }

      const orders = [result.order, ...stored.orders];
      if (!(await saveOrders(orders))) {
        return { ok: false, message: WRITE_FAILED };
      }

      dispatch({ type: 'loaded', orders });
      return result;
    },
    cancelOrder: async (id) => {
      const stored = await loadOrders();
      if (!stored.ok) {
        return { ok: false, message: READ_FAILED };
      }

      const order = stored.orders.find((candidate) => candidate.id === id);
      if (!order) {
        return { ok: false, message: 'This order could not be found.' };
      }
      if (!canCancelOrder(order)) {
        return { ok: false, message: 'This order can no longer be cancelled.' };
      }

      // The order is kept with its original totals; only the status changes.
      const orders = stored.orders.map((candidate) =>
        candidate.id === id ? { ...candidate, orderStatus: 'CANCELLED' as const } : candidate
      );
      if (!(await saveOrders(orders))) {
        return { ok: false, message: 'We could not cancel the order. Please try again.' };
      }

      dispatch({ type: 'loaded', orders });
      return { ok: true };
    },
  };

  return <OrdersContext value={value}>{children}</OrdersContext>;
}

export function useOrders(): OrdersContextValue {
  const context = use(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used inside <OrdersProvider>');
  }
  return context;
}
