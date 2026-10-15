import { useEffect, useEffectEvent } from 'react';

import { useOrders } from '@/features/orders/order-context';
import type { ApiError } from '@/services/api/api-error';
import type { Order } from '@/types/order';

export type TrackedOrderView =
  | { status: 'loading' }
  /** This device holds no tracking token for the order, so it cannot be fetched. */
  | { status: 'unknown' }
  | { status: 'error'; error: ApiError; refresh: () => void }
  | {
      status: 'ready';
      order: Order;
      isRefreshing: boolean;
      /** Set when the copy on screen could not be refreshed. */
      refreshError: ApiError | undefined;
      refresh: () => void;
    };

/**
 * One order for a screen. `fetchOnOpen` decides whether opening the screen asks the
 * server again when a copy is already in memory (the detail screen does; the success
 * screen was just handed the order by the server and does not need to).
 */
export function useTrackedOrder(orderNumber: string, fetchOnOpen: boolean): TrackedOrderView {
  const { index, isTracked, getDetail, refreshOrder, accountHistory } = useOrders();
  const detail = getDetail(orderNumber);
  const tracked = isTracked(orderNumber);

  const fetchIfNeeded = useEffectEvent(() => {
    if (index !== 'loading' && tracked && (fetchOnOpen || !detail?.order)) {
      refreshOrder(orderNumber);
    }
  });
  useEffect(() => {
    fetchIfNeeded();
  }, [index, tracked, orderNumber, accountHistory.sessionKey]);

  const refresh = () => {
    refreshOrder(orderNumber);
  };

  if (index === 'loading' || (!tracked && accountHistory.status === 'loading')) {
    return { status: 'loading' };
  }
  if (!tracked) {
    return { status: 'unknown' };
  }
  if (!detail && accountHistory.error?.code === 'UNAUTHENTICATED') {
    return { status: 'error', error: accountHistory.error, refresh };
  }
  if (detail?.order) {
    return {
      status: 'ready',
      order: detail.order,
      isRefreshing: detail.isLoading,
      refreshError: detail.error,
      refresh,
    };
  }
  if (detail?.error) {
    return { status: 'error', error: detail.error, refresh };
  }
  return { status: 'loading' };
}
