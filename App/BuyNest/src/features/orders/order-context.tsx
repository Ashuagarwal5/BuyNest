import { createContext, type PropsWithChildren, use, useEffect, useReducer, useRef } from 'react';

import {
  initialOrdersState,
  type OrderDetail,
  ordersReducer,
  type OrdersState,
} from '@/features/orders/order-reducer';
import {
  clearLegacyLocalOrders,
  countLegacyLocalOrders,
  loadTrackedOrders,
  saveTrackedOrders,
} from '@/features/orders/order-storage';
import {
  clearPendingAttempt,
  createAttempt,
  fingerprintSubmission,
  loadPendingAttempt,
  type OrderSubmission,
  type PendingOrderAttempt,
  savePendingAttempt,
} from '@/features/orders/pending-order';
import { ApiError, toApiError } from '@/services/api/api-error';
import {
  cancelOrder as cancelOrderRequest,
  createOrder,
  fetchOrder,
  type PlacedOrder,
} from '@/services/api/orders-api';
import type { Order, TrackedOrder } from '@/types/order';

/**
 * How an order submission ended. Callers must treat UNKNOWN very differently from FAILED:
 * FAILED means the server refused it and no order exists; UNKNOWN means the answer never
 * arrived, so the order may exist.
 */
export type SubmitOrderResult =
  | { ok: true; order: Order; cartFingerprint: string }
  /** Another submission is on the wire right now. */
  | { ok: false; kind: 'BUSY' }
  /** An earlier order is unconfirmed; it must be retried (or refused) before another is sent. */
  | { ok: false; kind: 'UNRESOLVED_ATTEMPT' }
  | { ok: false; kind: 'NOTHING_PENDING' }
  /** The server definitively refused the order. Nothing was created. */
  | { ok: false; kind: 'FAILED'; error: ApiError }
  /** No answer. The order may exist. The attempt is kept so it can be replayed. */
  | { ok: false; kind: 'UNKNOWN'; error: ApiError };

export type CancelOrderResult = { ok: true } | { ok: false; error: ApiError };

type OrdersContextValue = {
  index: OrdersState['index'];
  /** Newest first. */
  tracked: TrackedOrder[];
  legacyLocalOrderCount: number;
  /** False until the unconfirmed-order record has been read; do not submit before then. */
  pendingReady: boolean;
  /** An unconfirmed order submission, if any. */
  pending: PendingOrderAttempt | null;
  isSubmitting: boolean;
  getDetail: (orderNumber: string) => OrderDetail | undefined;
  isTracked: (orderNumber: string) => boolean;
  reloadIndex: () => Promise<void>;
  refreshOrder: (orderNumber: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  /** Sends a new order, or replays the unconfirmed one if this is the same order. */
  submitOrder: (submission: OrderSubmission) => Promise<SubmitOrderResult>;
  /** Replays the unconfirmed order exactly as it was first sent. */
  retryPending: () => Promise<SubmitOrderResult>;
  cancelOrder: (orderNumber: string) => Promise<CancelOrderResult>;
  removeLegacyLocalOrders: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

async function readIndex() {
  const [index, legacyLocalOrderCount] = await Promise.all([
    loadTrackedOrders(),
    countLegacyLocalOrders(),
  ]);
  return index.ok
    ? ({ type: 'indexLoaded', tracked: index.tracked, legacyLocalOrderCount } as const)
    : ({ type: 'indexFailed' } as const);
}

/**
 * Orders live on the server. This provider holds three things: the device's index of
 * order numbers and tracking tokens (persisted), the latest copy of each order fetched
 * with them (in memory only), and the unconfirmed order submission (persisted).
 */
export function OrdersProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(ordersReducer, initialOrdersState);
  // A ref, not state: it must flip synchronously so a fast double tap cannot start two.
  const isRequestInFlight = useRef(false);

  useEffect(() => {
    let isActive = true;
    readIndex().then((action) => {
      if (isActive) {
        dispatch(action);
      }
    });
    loadPendingAttempt().then((pending) => {
      if (isActive) {
        dispatch({ type: 'pendingLoaded', pending });
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  const findTracked = (orderNumber: string) =>
    state.tracked.find((tracked) => tracked.orderNumber === orderNumber);

  const refreshOrder = async (orderNumber: string) => {
    const tracked = findTracked(orderNumber);
    if (!tracked) {
      return;
    }
    dispatch({ type: 'orderLoading', orderNumber });
    try {
      dispatch({ type: 'orderLoaded', order: await fetchOrder(tracked) });
    } catch (error) {
      dispatch({ type: 'orderFailed', orderNumber, error: toApiError(error) });
    }
  };

  /** Runs one submission at a time. Returns BUSY, without doing anything, if one is running. */
  const withSubmissionLock = async (
    work: () => Promise<SubmitOrderResult>
  ): Promise<SubmitOrderResult> => {
    if (isRequestInFlight.current) {
      return { ok: false, kind: 'BUSY' };
    }
    isRequestInFlight.current = true;
    dispatch({ type: 'submitting', value: true });
    try {
      return await work();
    } finally {
      isRequestInFlight.current = false;
      dispatch({ type: 'submitting', value: false });
    }
  };

  /**
   * Remembers a confirmed order so it can be opened later. The unconfirmed-order record is
   * removed only after the order is safely in the index: if saving fails, the record stays,
   * and replaying it later returns the same order and the same token to save again.
   */
  const trackConfirmedOrder = async (placed: PlacedOrder) => {
    // The index is re-read so an order tracked moments ago is not overwritten. If it
    // cannot be read, nothing is written (that could wipe the other orders); the order
    // is still kept in memory for this session.
    const stored = await loadTrackedOrders();
    const base = stored.ok ? stored.tracked : state.tracked;
    // A replay returns an order that may already be tracked; it is not added twice.
    const tracked = [
      placed.tracked,
      ...base.filter((entry) => entry.orderNumber !== placed.tracked.orderNumber),
    ];
    const isSaved = stored.ok && (await saveTrackedOrders(tracked));

    dispatch({ type: 'orderTracked', tracked, order: placed.order });
    return isSaved;
  };

  /**
   * Sends `attempt` exactly as stored. Always called under the submission lock.
   * `isReplay` is true for an attempt that is already saved on the device.
   */
  const sendAttempt = async (
    attempt: PendingOrderAttempt,
    isReplay: boolean
  ): Promise<SubmitOrderResult> => {
    const sending: PendingOrderAttempt = { ...attempt, status: 'PENDING' };
    const isSaved = await savePendingAttempt(sending);

    // A NEW request is on the device BEFORE it is sent. If the phone cannot save it,
    // nothing is sent: a lost response could not be recovered and a duplicate could follow.
    // (A replay is already saved; failing to rewrite its status changes nothing important.)
    if (!isSaved && !isReplay) {
      await clearPendingAttempt();
      dispatch({ type: 'pendingChanged', pending: null });
      return { ok: false, kind: 'FAILED', error: new ApiError('STORAGE_ERROR') };
    }
    dispatch({ type: 'pendingChanged', pending: sending });

    let placed: PlacedOrder;
    try {
      placed = await createOrder(sending.request);
    } catch (error) {
      const apiError = toApiError(error);

      if (apiError.isOutcomeUnknown) {
        // The server may have created the order. Keep the attempt for a safe replay.
        const unknown: PendingOrderAttempt = { ...sending, status: 'UNKNOWN' };
        await savePendingAttempt(unknown);
        dispatch({ type: 'pendingChanged', pending: unknown });
        return { ok: false, kind: 'UNKNOWN', error: apiError };
      }

      // A definite refusal: the server created nothing, so the attempt is over.
      await clearPendingAttempt();
      dispatch({ type: 'pendingChanged', pending: null });
      return { ok: false, kind: 'FAILED', error: apiError };
    }

    if (await trackConfirmedOrder(placed)) {
      await clearPendingAttempt();
      dispatch({ type: 'pendingChanged', pending: null });
    }
    return { ok: true, order: placed.order, cartFingerprint: sending.cartFingerprint };
  };

  const value: OrdersContextValue = {
    index: state.index,
    tracked: state.tracked,
    legacyLocalOrderCount: state.legacyLocalOrderCount,
    pendingReady: state.pendingReady,
    pending: state.pending,
    isSubmitting: state.isSubmitting,
    getDetail: (orderNumber) => state.details[orderNumber],
    isTracked: (orderNumber) => findTracked(orderNumber) !== undefined,
    reloadIndex: async () => {
      dispatch({ type: 'indexLoading' });
      dispatch(await readIndex());
    },
    refreshOrder,
    // Each order succeeds or fails on its own, so one unreachable order never hides the rest.
    refreshAll: async () => {
      await Promise.all(state.tracked.map((tracked) => refreshOrder(tracked.orderNumber)));
    },
    submitOrder: (submission) =>
      withSubmissionLock(async () => {
        const unresolved = await loadPendingAttempt();
        if (unresolved) {
          // The same order again is a retry and replays the original request. Anything else
          // would be a second order while the first is unconfirmed, so it is refused.
          return unresolved.fingerprint === fingerprintSubmission(submission)
            ? sendAttempt(unresolved, true)
            : { ok: false, kind: 'UNRESOLVED_ATTEMPT' };
        }
        return sendAttempt(createAttempt(submission, new Date()), false);
      }),
    retryPending: () =>
      withSubmissionLock(async () => {
        const unresolved = await loadPendingAttempt();
        return unresolved ? sendAttempt(unresolved, true) : { ok: false, kind: 'NOTHING_PENDING' };
      }),
    cancelOrder: async (orderNumber) => {
      const tracked = findTracked(orderNumber);
      if (!tracked) {
        return { ok: false, error: toApiError(undefined) };
      }
      try {
        // The response is the server's updated order, so the screen shows its verdict.
        dispatch({ type: 'orderLoaded', order: await cancelOrderRequest(tracked) });
        return { ok: true };
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.code === 'ORDER_CANNOT_BE_CANCELLED') {
          // The shop moved the order on; fetch its real status so the screen catches up.
          await refreshOrder(orderNumber);
        }
        return { ok: false, error: apiError };
      }
    },
    removeLegacyLocalOrders: async () => {
      if (await clearLegacyLocalOrders()) {
        dispatch({ type: 'legacyCleared' });
      }
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
