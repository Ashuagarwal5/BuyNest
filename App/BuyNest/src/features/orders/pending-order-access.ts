import type { ApiError } from '../../services/api/api-error';
import type { PurchaseSession } from '../auth/purchase-session';

/** Missing ownership metadata denotes a legacy guest attempt, never the current login. */
export function pendingOrderAccess(accountId: string | undefined, session: PurchaseSession):
  { allowed: false } | { allowed: true; token: string } {
  if (session.status === 'loading') return { allowed: false };
  if (!accountId) return { allowed: false };
  if (session.status !== 'signedIn' || session.account.id !== accountId) return { allowed: false };
  return { allowed: true, token: session.token };
}

/** A refused replay's authentication does not establish whether its earlier request succeeded. */
export function keepPendingOrder(error: ApiError, isReplay: boolean, accountId?: string): boolean {
  return error.isOutcomeUnknown || Boolean(isReplay && accountId &&
    (error.code === 'UNAUTHENTICATED' || error.code === 'IDEMPOTENCY_CONFLICT'));
}
