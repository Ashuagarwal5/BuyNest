import {
  createContext, type PropsWithChildren, use, useCallback, useEffect, useLayoutEffect,
  useMemo, useReducer, useRef, useState,
} from 'react';

import {
  accountAddressesReducer, emptyAccountAddresses, visibleAccountAddresses,
} from '@/features/addresses/account-addresses-state';
import { type AddressDraft, MAX_SAVED_ADDRESSES, type SavedAddress } from '@/features/addresses/address-types';
import { loadAddresses, normaliseDefaults, saveAddresses } from '@/features/addresses/addresses-storage';
import { useAuth } from '@/features/auth/auth-context';
import {
  addAccountAddress, defaultAccountAddress, fetchAccountAddresses, removeAccountAddress,
  updateAccountAddress,
} from '@/services/api/account-addresses-api';
import { ApiError, toApiError } from '@/services/api/api-error';

type AddressesContextValue = {
  addresses: SavedAddress[];
  isHydrated: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  add: (draft: AddressDraft) => Promise<SavedAddress | 'full'>;
  update: (id: string, draft: AddressDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
};

const AddressesContext = createContext<AddressesContextValue | null>(null);
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Guest addresses stay on this device; each signed-in account has its own server book. */
export function AddressesProvider({ children }: PropsWithChildren) {
  const { state: auth, expireSession } = useAuth();
  const token = auth.status === 'signedIn' ? auth.token : null;
  const scope = auth.status === 'loading' ? 'loading' : token ?? 'guest';
  const scopeRef = useRef(scope);
  const requestSequence = useRef(0);
  const guestBook = useRef<SavedAddress[]>([]);
  const guestQueue = useRef<Promise<void>>(Promise.resolve());
  const accountQueue = useRef<Promise<void>>(Promise.resolve());
  const [guestAddresses, setGuestAddresses] = useState<SavedAddress[]>([]);
  const [guestReady, setGuestReady] = useState(false);
  const [guestError, setGuestError] = useState<ApiError | null>(null);
  const [accountBook, dispatch] = useReducer(accountAddressesReducer, emptyAccountAddresses);

  useLayoutEffect(() => { scopeRef.current = scope; }, [scope]);

  useEffect(() => {
    let active = true;
    loadAddresses().then((saved) => {
      if (!active) return;
      guestBook.current = saved;
      setGuestAddresses(saved);
      setGuestReady(true);
    });
    return () => { active = false; };
  }, []);

  const loadAccountBook = useCallback(async (sessionToken: string, signal?: AbortSignal) => {
    if (scopeRef.current !== sessionToken) return;
    const requestId = ++requestSequence.current;
    dispatch({ type: 'start', sessionKey: sessionToken, requestId });
    try {
      const addresses = await fetchAccountAddresses(sessionToken, signal);
      if (scopeRef.current === sessionToken) dispatch({ type: 'loaded', sessionKey: sessionToken, requestId, addresses });
    } catch (error) {
      if (scopeRef.current === sessionToken && !signal?.aborted) {
        const apiError = toApiError(error);
        dispatch({ type: 'failed', sessionKey: sessionToken, requestId, error: apiError });
        if (apiError.code === 'UNAUTHENTICATED') await expireSession(sessionToken);
      }
    }
  }, [expireSession]);

  useEffect(() => {
    if (!token) {
      dispatch({ type: 'reset' });
      return;
    }
    const controller = new AbortController();
    void loadAccountBook(token, controller.signal);
    return () => controller.abort();
  }, [token, loadAccountBook]);

  const reload = useCallback(async () => {
    if (token) await loadAccountBook(token);
    else if (auth.status === 'signedOut') setGuestError(null);
  }, [token, auth.status, loadAccountBook]);

  const changeGuest = useCallback(<T,>(change: (current: SavedAddress[]) => { addresses: SavedAddress[]; result: T }): Promise<T> => {
    const operation = async () => {
      if (scopeRef.current !== 'guest') throw new ApiError('UNAUTHENTICATED');
      if (!guestReady) throw new ApiError('STORAGE_ERROR');
      const next = change(guestBook.current);
      if (!await saveAddresses(next.addresses)) {
        const error = new ApiError('STORAGE_ERROR');
        setGuestError(error);
        throw error;
      }
      guestBook.current = next.addresses;
      setGuestAddresses(next.addresses);
      setGuestError(null);
      if (scopeRef.current !== 'guest') throw new ApiError('UNAUTHENTICATED');
      return next.result;
    };
    const result = guestQueue.current.then(operation, operation);
    guestQueue.current = result.then(() => undefined, () => undefined);
    return result;
  }, [guestReady]);

  const changeAccount = useCallback(<T,>(operation: (sessionToken: string, requestId: number) => Promise<T>): Promise<T> => {
    if (!token) return Promise.reject(new ApiError('UNAUTHENTICATED'));
    const sessionToken = token;
    const perform = async () => {
      if (scopeRef.current !== sessionToken) throw new ApiError('UNAUTHENTICATED');
      const requestId = ++requestSequence.current;
      dispatch({ type: 'start', sessionKey: sessionToken, requestId });
      try {
        const result = await operation(sessionToken, requestId);
        if (scopeRef.current !== sessionToken) throw new ApiError('UNAUTHENTICATED');
        return result;
      } catch (error) {
        const apiError = toApiError(error);
        if (scopeRef.current === sessionToken) {
          dispatch({ type: 'failed', sessionKey: sessionToken, requestId, error: apiError });
          if (apiError.code === 'UNAUTHENTICATED') await expireSession(sessionToken);
        }
        throw apiError;
      }
    };
    const result = accountQueue.current.then(perform, perform);
    accountQueue.current = result.then(() => undefined, () => undefined);
    return result;
  }, [token, expireSession]);

  const add = useCallback(async (draft: AddressDraft): Promise<SavedAddress | 'full'> => {
    if (token) {
      try {
        return await changeAccount(async (sessionToken, requestId) => {
          const address = await addAccountAddress(sessionToken, draft);
          if (scopeRef.current === sessionToken) dispatch({ type: 'saved', sessionKey: sessionToken, requestId, address });
          return address;
        });
      } catch (error) {
        if (toApiError(error).code === 'ADDRESS_BOOK_FULL') return 'full';
        throw error;
      }
    }
    return changeGuest<SavedAddress | 'full'>((current) => {
      if (current.length >= MAX_SAVED_ADDRESSES) return { addresses: current, result: 'full' };
      const created = { ...draft, id: newId(), isDefault: draft.isDefault || current.length === 0 };
      return { addresses: normaliseDefaults([...current.map((address) => created.isDefault ? { ...address, isDefault: false } : address), created]), result: created };
    });
  }, [token, changeAccount, changeGuest]);

  const update = useCallback(async (id: string, draft: AddressDraft) => {
    if (token) {
      await changeAccount(async (sessionToken, requestId) => {
        const address = await updateAccountAddress(sessionToken, id, draft);
        if (scopeRef.current === sessionToken) dispatch({ type: 'saved', sessionKey: sessionToken, requestId, address });
      });
      return;
    }
    await changeGuest((current) => ({ addresses: normaliseDefaults(current.map((address) => address.id === id ? { ...draft, id } : draft.isDefault ? { ...address, isDefault: false } : address)), result: undefined }));
  }, [token, changeAccount, changeGuest]);

  const remove = useCallback(async (id: string) => {
    if (token) {
      await changeAccount(async (sessionToken, requestId) => {
        await removeAccountAddress(sessionToken, id);
        if (scopeRef.current === sessionToken) dispatch({ type: 'removed', sessionKey: sessionToken, requestId, id });
      });
      return;
    }
    await changeGuest((current) => ({ addresses: normaliseDefaults(current.filter((address) => address.id !== id)), result: undefined }));
  }, [token, changeAccount, changeGuest]);

  const setDefault = useCallback(async (id: string) => {
    if (token) {
      await changeAccount(async (sessionToken, requestId) => {
        const addresses = await defaultAccountAddress(sessionToken, id);
        if (scopeRef.current === sessionToken) dispatch({ type: 'loaded', sessionKey: sessionToken, requestId, addresses });
      });
      return;
    }
    await changeGuest((current) => ({ addresses: normaliseDefaults(current.map((address) => ({ ...address, isDefault: address.id === id }))), result: undefined }));
  }, [token, changeAccount, changeGuest]);

  const visible = useMemo(() => token ? visibleAccountAddresses(accountBook, token) : null, [accountBook, token]);
  const addresses = auth.status === 'loading' ? emptyAccountAddresses.addresses : visible ? visible.addresses : guestAddresses;
  const isHydrated = auth.status !== 'loading' && (visible ? visible.isHydrated : guestReady);
  const error = visible ? visible.error : auth.status === 'signedOut' ? guestError : null;
  const value = useMemo(() => ({ addresses, isHydrated, error, reload, add, update, remove, setDefault }),
    [addresses, isHydrated, error, reload, add, update, remove, setDefault]);

  return <AddressesContext value={value}>{children}</AddressesContext>;
}

export function useAddresses(): AddressesContextValue {
  const value = use(AddressesContext);
  if (!value) throw new Error('useAddresses must be used inside <AddressesProvider>');
  return value;
}
