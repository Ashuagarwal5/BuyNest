import { useEffect, useReducer, useRef } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { accountOrdersReducer, emptyAccountOrders } from '@/features/orders/account-orders-state';
import { toApiError } from '@/services/api/api-error';
import { cancelAccountOrder, fetchAccountOrder, fetchAccountOrders } from '@/services/api/orders-api';
import type { Order } from '@/types/order';

export function useAccountOrders() {
  const { state: auth } = useAuth();
  const sessionKey = auth.status === 'signedIn' ? auth.token : null;
  const [state, dispatch] = useReducer(accountOrdersReducer, emptyAccountOrders);
  const requestId = useRef(0);
  const listController = useRef<AbortController | null>(null);
  // Gate rendering immediately on logout/account switch, before the cleanup effect runs.
  const visible = state.sessionKey === sessionKey ? state : emptyAccountOrders;

  const load = async (page: number) => {
    if (!sessionKey) return;
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    const id = ++requestId.current;
    dispatch({ type: 'start', sessionKey, requestId: id, page });
    try {
      const result = await fetchAccountOrders(sessionKey, page, controller.signal);
      if (!controller.signal.aborted) dispatch({ type: 'loaded', sessionKey, requestId: id, ...result });
    } catch (error) {
      if (!controller.signal.aborted) dispatch({ type: 'failed', sessionKey, requestId: id, error: toApiError(error) });
    }
  };

  useEffect(() => {
    if (!sessionKey) {
      dispatch({ type: 'reset' });
      return;
    }
    const controller = new AbortController();
    listController.current = controller;
    const id = ++requestId.current;
    dispatch({ type: 'start', sessionKey, requestId: id, page: 1 });
    fetchAccountOrders(sessionKey, 1, controller.signal).then(
      (result) => { if (!controller.signal.aborted) dispatch({ type: 'loaded', sessionKey, requestId: id, ...result }); },
      (error: unknown) => { if (!controller.signal.aborted) dispatch({ type: 'failed', sessionKey, requestId: id, error: toApiError(error) }); }
    );
    return () => {
      controller.abort();
      listController.current?.abort();
    };
  }, [sessionKey]);

  const refreshOrder = async (orderNumber: string) => {
    if (!sessionKey) return;
    dispatch({ type: 'detailLoading', sessionKey, orderNumber });
    try {
      dispatch({ type: 'detailLoaded', sessionKey, order: await fetchAccountOrder(sessionKey, orderNumber) });
    } catch (error) {
      dispatch({ type: 'detailFailed', sessionKey, orderNumber, error: toApiError(error) });
    }
  };

  const cancelOrder = async (orderNumber: string) => {
    if (!sessionKey) return { ok: false as const, error: toApiError(undefined) };
    try {
      const order = await cancelAccountOrder(sessionKey, orderNumber);
      dispatch({ type: 'detailLoaded', sessionKey, order });
      return { ok: true as const };
    } catch (error) {
      const apiError = toApiError(error);
      dispatch({ type: 'detailFailed', sessionKey, orderNumber, error: apiError });
      if (apiError.code === 'ORDER_CANNOT_BE_CANCELLED') await refreshOrder(orderNumber);
      return { ok: false as const, error: apiError };
    }
  };

  return {
    ...visible, sessionKey, active: sessionKey !== null,
    status: auth.status === 'loading' || (sessionKey && visible.status === 'idle') ? 'loading' as const : visible.status,
    refresh: () => load(1),
    loadMore: () => visible.hasMore && !visible.loadingMore ? load(visible.page + 1) : Promise.resolve(),
    rememberOrder: (order: Order) => {
      if (sessionKey) dispatch({ type: 'detailLoaded', sessionKey, order });
    },
    refreshOrder, cancelOrder,
  };
}
