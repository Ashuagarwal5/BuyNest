/**
 * The order submission the server has not confirmed yet.
 *
 * WHY THIS EXISTS. The server creates at most one order per clientRequestId, and a repeat
 * of the same request returns the order it already made. That makes retrying safe, but only
 * if the retry is the SAME request: same id and same contents. If a response is lost the
 * app cannot tell "the order was never created" from "it was created and I never heard",
 * so it must be able to send the original request again, even after the app was closed.
 *
 * So, before anything is sent, the complete request is written to the device here. It
 * stays until the server gives a definite answer:
 *   - the order was created (or already existed)  -> tracked locally, record removed
 *   - the server definitively refused it          -> record removed, nothing was created
 *   - no answer (timeout, dropped connection...)  -> record kept; the customer can retry
 *
 * While a record exists no different order is submitted. That is the rule that makes
 * duplicates impossible: the old request is either confirmed or refused first.
 *
 * Statuses: PENDING (sent, no answer yet) and UNKNOWN (no answer, and the app knows it).
 * "Resolved" is the record being deleted. A PENDING record found at startup belongs to a
 * previous run of the app, which stopped before it heard back, so it is turned into UNKNOWN.
 */

import { fingerprintCartItems } from '@/features/cart/cart-fingerprint';
import type { CreateOrderRequest } from '@/services/api/orders-api';
import { readJson, removeItem, StorageKeys, writeJson } from '@/services/storage';

export type OrderSubmission = Omit<CreateOrderRequest, 'clientRequestId'>;

export type PendingOrderAttempt = {
  clientRequestId: string;
  /** Fingerprint of `request` without its id: whether another submission is the same one. */
  fingerprint: string;
  /** Fingerprint of the cart the order was made from; guards against clearing a newer cart. */
  cartFingerprint: string;
  /** The exact request to replay. Holds the customer's details until the attempt resolves. */
  request: CreateOrderRequest;
  /** ISO 8601 timestamp. */
  createdAt: string;
  status: 'PENDING' | 'UNKNOWN';
};

const SCHEMA_VERSION = 2;

/**
 * The attempt as this app process knows it. Storage can fail; this cannot, so the rule
 * "no different order while one is unresolved" still holds within a session regardless.
 * `undefined` means storage has not been read yet.
 */
let cached: PendingOrderAttempt | null | undefined;

/** A stable description of the submission: the same order contents give the same string. */
export function fingerprintSubmission(submission: OrderSubmission): string {
  return JSON.stringify({
    customer: [submission.customer.fullName, submission.customer.mobile],
    address: [
      submission.address.addressLine1,
      submission.address.addressLine2,
      submission.address.landmark,
      submission.address.city,
      submission.address.pincode,
    ],
    deliveryAreaId: submission.deliveryAreaId,
    items: submission.items
      .map((item) => `${item.productId}x${item.quantity}`)
      .sort((a, b) => a.localeCompare(b)),
    paymentMethod: submission.paymentMethod,
  });
}

/**
 * Unique enough never to collide between submissions. It is an idempotency key, not a
 * secret, so Math.random is sufficient and no crypto dependency is needed.
 */
function generateClientRequestId(): string {
  const random = () => Math.random().toString(36).slice(2, 10);
  return `bn-${Date.now().toString(36)}-${random()}${random()}`;
}

export function createAttempt(submission: OrderSubmission, now: Date): PendingOrderAttempt {
  const clientRequestId = generateClientRequestId();
  return {
    clientRequestId,
    fingerprint: fingerprintSubmission(submission),
    cartFingerprint: fingerprintCartItems(submission.items),
    request: { clientRequestId, ...submission },
    createdAt: now.toISOString(),
    status: 'PENDING',
  };
}

const isText = (value: unknown): value is string => typeof value === 'string';

/** Checks a stored attempt well enough to trust it as a request to send to the server. */
function isPendingAttempt(value: unknown): value is PendingOrderAttempt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const attempt = value as Record<string, unknown>;
  const request = attempt.request as Record<string, unknown> | null | undefined;
  if (typeof request !== 'object' || request === null) {
    return false;
  }
  const customer = request.customer as Record<string, unknown> | null | undefined;
  const address = request.address as Record<string, unknown> | null | undefined;

  return (
    isText(attempt.clientRequestId) &&
    isText(attempt.fingerprint) &&
    isText(attempt.cartFingerprint) &&
    isText(attempt.createdAt) &&
    (attempt.status === 'PENDING' || attempt.status === 'UNKNOWN') &&
    request.clientRequestId === attempt.clientRequestId &&
    typeof customer === 'object' &&
    customer !== null &&
    isText(customer.fullName) &&
    isText(customer.mobile) &&
    typeof address === 'object' &&
    address !== null &&
    isText(address.addressLine1) &&
    isText(address.addressLine2) &&
    isText(address.landmark) &&
    isText(address.city) &&
    isText(address.pincode) &&
    isText(request.deliveryAreaId) &&
    request.paymentMethod === 'COD' &&
    Array.isArray(request.items) &&
    request.items.length > 0 &&
    request.items.every((item: unknown) => {
      const line = item as Record<string, unknown> | null;
      return (
        typeof line === 'object' &&
        line !== null &&
        isText(line.productId) &&
        typeof line.quantity === 'number' &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0
      );
    })
  );
}

/**
 * Reads the stored attempt once per app run. If the stored record cannot be read as a
 * valid attempt it is treated as absent: it cannot be replayed, so there is nothing safe
 * to do with it.
 */
export async function loadPendingAttempt(): Promise<PendingOrderAttempt | null> {
  if (cached !== undefined) {
    return cached;
  }

  // The v1 record held only an id and a fingerprint: nothing that can be replayed.
  await removeItem(StorageKeys.legacyPendingOrder);

  const result = await readJson(StorageKeys.pendingOrder);
  let attempt: PendingOrderAttempt | null = null;
  if (result.ok && typeof result.value === 'object' && result.value !== null) {
    const stored = result.value as { version?: unknown; attempt?: unknown };
    if (stored.version === SCHEMA_VERSION && isPendingAttempt(stored.attempt)) {
      attempt = stored.attempt;
    }
  }

  // A record still marked PENDING was written by an earlier run that never heard back.
  if (attempt?.status === 'PENDING') {
    attempt = { ...attempt, status: 'UNKNOWN' };
    await writeJson(StorageKeys.pendingOrder, { version: SCHEMA_VERSION, attempt });
  }

  // Something may have saved or cleared the attempt while storage was being read; that is
  // newer than what was read, and `null` there means "cleared", so test for undefined only.
  if (cached === undefined) {
    cached = attempt;
  }
  return cached;
}

/** True only once the attempt is on the device, which must happen before it is sent. */
export async function savePendingAttempt(attempt: PendingOrderAttempt): Promise<boolean> {
  cached = attempt;
  return writeJson(StorageKeys.pendingOrder, { version: SCHEMA_VERSION, attempt });
}

/** Call only once the server has given a definite answer. */
export async function clearPendingAttempt(): Promise<void> {
  cached = null;
  await removeItem(StorageKeys.pendingOrder);
}
