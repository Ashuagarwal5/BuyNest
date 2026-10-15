import { createContext, type PropsWithChildren, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clearToken, readToken, saveToken } from '@/features/auth/auth-storage';
import { signOutGoogle } from '@/features/auth/google-sign-in';
import { unregisterThisDevice } from '@/features/notifications/push-registration';
import { validatePurchaseSession } from '@/features/auth/purchase-session';
import {
  type Account,
  deleteAccountRequest,
  fetchAccount,
  linkGoogleAccountRequest,
  type SignInResult,
  signOutRequest,
  updateAccountRequest,
} from '@/services/api/auth-api';
import { ApiError, toApiError } from '@/services/api/api-error';

type AuthState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'signedOut'; reason?: 'expired' }
  | { status: 'signedIn'; account: Account; token: string };

type AuthContextValue = {
  state: AuthState;
  /** Keeps a successful sign-in. Rejects if the phone could not store it. */
  completeSignIn: (result: SignInResult) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account on the server, then signs out. Rejects with an ApiError if the server refuses. */
  deleteAccount: () => Promise<void>;
  updateProfile: (profile: { fullName: string; mobile: string }) => Promise<void>;
  linkGoogle: (idToken: string) => Promise<void>;
  expireSession: (token: string) => Promise<void>;
  continueAsGuest: () => void;
  retrySession: () => void;
  validateSession: (signal?: AbortSignal) => Promise<{ account: Account; token: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const currentState = useRef<AuthState>(state);
  const revision = useRef(0);
  const tokenWrites = useRef<Promise<unknown>>(Promise.resolve());
  const commit = useCallback((next: AuthState) => {
    currentState.current = next;
    setState(next);
  }, []);
  // Serialize SecureStore changes so a late logout cannot erase a newer sign-in.
  const writeToken = useCallback(<T,>(work: () => Promise<T>): Promise<T> => {
    const result = tokenWrites.current.then(work, work);
    tokenWrites.current = result.then(() => undefined, () => undefined);
    return result;
  }, []);

  // Restore the sign-in when the app opens. A 401 means it ended (signed out elsewhere, expired,
  // account deleted). Any other failure, such as no signal, keeps the token for the next launch.
  useEffect(() => {
    let isStale = false;
    const startedAt = revision.current;
    (async () => {
      const token = await readToken();
      if (!token) {
        if (!isStale && revision.current === startedAt) commit({ status: 'signedOut' });
        return;
      }
      try {
        const account = await fetchAccount(token);
        if (!isStale && revision.current === startedAt) commit({ status: 'signedIn', account, token });
      } catch (error) {
        const expired = toApiError(error).code === 'UNAUTHENTICATED';
        if (!isStale && revision.current === startedAt) {
          if (expired) await writeToken(clearToken);
          if (!isStale && revision.current === startedAt) commit(expired
            ? { status: 'signedOut', reason: 'expired' }
            : { status: 'error', error: toApiError(error) });
        }
      }
    })();
    return () => {
      isStale = true;
    };
  }, [commit, writeToken, restoreAttempt]);

  const retrySession = useCallback(() => {
    ++revision.current;
    commit({ status: 'loading' });
    setRestoreAttempt((value) => value + 1);
  }, [commit]);

  const completeSignIn = useCallback(async (result: SignInResult) => {
    const startedAt = ++revision.current;
    const isSaved = await writeToken(() => saveToken(result.token));
    if (!isSaved) {
      await signOutRequest(result.token).catch(() => undefined);
      throw new ApiError('STORAGE_ERROR');
    }
    if (revision.current !== startedAt) {
      await signOutRequest(result.token).catch(() => undefined);
      throw new ApiError('UNAUTHENTICATED');
    }
    commit({ status: 'signedIn', account: result.account, token: result.token });
  }, [commit, writeToken]);

  const endSession = useCallback(async () => {
    ++revision.current;
    commit({ status: 'signedOut' });
    const cleared = await writeToken(clearToken);
    await signOutGoogle();
    return cleared;
  }, [commit, writeToken]);

  const expireSession = useCallback(async (token: string) => {
    const current = currentState.current;
    if (current.status !== 'signedIn' || current.token !== token) return;
    ++revision.current;
    commit({ status: 'signedOut', reason: 'expired' });
    await writeToken(clearToken);
  }, [commit, writeToken]);

  const signOut = useCallback(async () => {
    const current = currentState.current;
    // Stop pushes for this account on this phone; best effort, never blocks signing out.
    if (current.status === 'signedIn') void unregisterThisDevice(current.token);
    const cleared = await endSession();
    if (current.status === 'signedIn') {
      const revoked = await signOutRequest(current.token).then(() => true, (error: unknown) =>
        toApiError(error).code === 'UNAUTHENTICATED');
      if (!cleared && !revoked) throw new ApiError('SIGN_OUT_FAILED');
    }
  }, [endSession]);

  const deleteAccount = useCallback(async () => {
    const current = currentState.current;
    if (current.status !== 'signedIn') {
      return;
    }
    await deleteAccountRequest(current.token);
    if (currentState.current.status === 'signedIn' && currentState.current.token === current.token) await endSession();
  }, [endSession]);

  const changeProfile = useCallback(async (request: (token: string) => Promise<Account>) => {
    const current = currentState.current;
    if (current.status !== 'signedIn') throw new ApiError('UNAUTHENTICATED');
    try {
      const account = await request(current.token);
      const latest = currentState.current;
      if (latest.status !== 'signedIn' || latest.token !== current.token) throw new ApiError('UNAUTHENTICATED');
      commit({ ...latest, account });
    } catch (error) {
      if (toApiError(error).code === 'UNAUTHENTICATED') await expireSession(current.token);
      throw error;
    }
  }, [commit, expireSession]);

  const validateSession = useCallback(async (signal?: AbortSignal) => {
    const current = currentState.current;
    try {
      return await validatePurchaseSession(current, (token) => fetchAccount(token, signal), () => currentState.current);
    } catch (error) {
      if (current.status === 'signedIn' && toApiError(error).code === 'UNAUTHENTICATED') await expireSession(current.token);
      throw error;
    }
  }, [expireSession]);

  const updateProfile = useCallback((profile: { fullName: string; mobile: string }) =>
    changeProfile((token) => updateAccountRequest(token, profile)), [changeProfile]);
  const linkGoogle = useCallback((idToken: string) =>
    changeProfile((token) => linkGoogleAccountRequest(token, idToken)), [changeProfile]);
  const continueAsGuest = useCallback(() => {
    if (currentState.current.status === 'signedOut') commit({ status: 'signedOut' });
  }, [commit]);

  const value = useMemo(
    () => ({ state, completeSignIn, signOut, deleteAccount, updateProfile, linkGoogle, expireSession, continueAsGuest, retrySession, validateSession }),
    [state, completeSignIn, signOut, deleteAccount, updateProfile, linkGoogle, expireSession, continueAsGuest, retrySession, validateSession]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
