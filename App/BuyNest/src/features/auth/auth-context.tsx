import { createContext, type PropsWithChildren, use, useCallback, useEffect, useMemo, useState } from 'react';

import { clearToken, readToken, saveToken } from '@/features/auth/auth-storage';
import { signOutGoogle } from '@/features/auth/google-sign-in';
import {
  type Account,
  deleteAccountRequest,
  fetchAccount,
  type SignInResult,
  signOutRequest,
} from '@/services/api/auth-api';
import { ApiError, toApiError } from '@/services/api/api-error';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; account: Account; token: string };

type AuthContextValue = {
  state: AuthState;
  /** Keeps a successful sign-in. Rejects if the phone could not store it. */
  completeSignIn: (result: SignInResult) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account on the server, then signs out. Rejects with an ApiError if the server refuses. */
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Restore the sign-in when the app opens. A 401 means it ended (signed out elsewhere, expired,
  // account deleted). Any other failure, such as no signal, keeps the token for the next launch.
  useEffect(() => {
    let isStale = false;
    (async () => {
      const token = await readToken();
      if (!token) {
        if (!isStale) setState({ status: 'signedOut' });
        return;
      }
      try {
        const account = await fetchAccount(token);
        if (!isStale) setState({ status: 'signedIn', account, token });
      } catch (error) {
        if (toApiError(error).code === 'UNAUTHENTICATED') {
          await clearToken();
        }
        if (!isStale) setState({ status: 'signedOut' });
      }
    })();
    return () => {
      isStale = true;
    };
  }, []);

  const completeSignIn = useCallback(async (result: SignInResult) => {
    const isSaved = await saveToken(result.token);
    if (!isSaved) {
      throw new ApiError('STORAGE_ERROR');
    }
    setState({ status: 'signedIn', account: result.account, token: result.token });
  }, []);

  const endSession = useCallback(async () => {
    await clearToken();
    await signOutGoogle();
    setState({ status: 'signedOut' });
  }, []);

  const signOut = useCallback(async () => {
    const current = state;
    if (current.status === 'signedIn') {
      // Best effort: the phone is signed out either way, and the server session expires by itself.
      await signOutRequest(current.token).catch(() => undefined);
    }
    await endSession();
  }, [state, endSession]);

  const deleteAccount = useCallback(async () => {
    if (state.status !== 'signedIn') {
      return;
    }
    await deleteAccountRequest(state.token);
    await endSession();
  }, [state, endSession]);

  const value = useMemo(
    () => ({ state, completeSignIn, signOut, deleteAccount }),
    [state, completeSignIn, signOut, deleteAccount]
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
