import { ApiError } from '../../services/api/api-error';

export type PurchaseSession =
  | { status: 'loading' | 'signedOut' | 'error' }
  | { status: 'signedIn'; account: { id: string }; token: string };

/** Validate with the server, then reject logout/account switches while that request was pending. */
export async function validatePurchaseSession<T extends { id: string }>(
  session: PurchaseSession,
  readAccount: (token: string) => Promise<T>,
  currentSession: () => PurchaseSession
): Promise<{ account: T; token: string }> {
  if (session.status !== 'signedIn') throw new ApiError('UNAUTHENTICATED');
  const account = await readAccount(session.token);
  const latest = currentSession();
  if (latest.status !== 'signedIn' || latest.token !== session.token ||
      latest.account.id !== session.account.id || account.id !== session.account.id) {
    throw new ApiError('UNAUTHENTICATED');
  }
  return { account, token: session.token };
}
