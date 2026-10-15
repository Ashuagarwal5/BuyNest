import type { SavedAddress } from './address-types';
import type { ApiError } from '../../services/api/api-error';

export type AccountAddressesState = {
  sessionKey: string | null;
  requestId: number;
  addresses: SavedAddress[];
  isHydrated: boolean;
  error: ApiError | null;
};

export const emptyAccountAddresses: AccountAddressesState = {
  sessionKey: null, requestId: 0, addresses: [], isHydrated: false, error: null,
};

type Action =
  | { type: 'reset' }
  | { type: 'start'; sessionKey: string; requestId: number }
  | { type: 'loaded'; sessionKey: string; requestId: number; addresses: SavedAddress[] }
  | { type: 'saved'; sessionKey: string; requestId: number; address: SavedAddress }
  | { type: 'removed'; sessionKey: string; requestId: number; id: string }
  | { type: 'failed'; sessionKey: string; requestId: number; error: ApiError };

function normalizeDefaults(addresses: SavedAddress[]) {
  const defaultId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id;
  return addresses.map((address) => ({ ...address, isDefault: address.id === defaultId }));
}

/** Session and request guards prevent late responses from revealing a previous account's book. */
export function accountAddressesReducer(state: AccountAddressesState, action: Action): AccountAddressesState {
  if (action.type === 'reset') return emptyAccountAddresses;
  if (action.type === 'start') {
    const previous = state.sessionKey === action.sessionKey ? state : emptyAccountAddresses;
    return { ...previous, sessionKey: action.sessionKey, requestId: action.requestId, error: null };
  }
  if (state.sessionKey !== action.sessionKey || state.requestId !== action.requestId) return state;
  if (action.type === 'failed') {
    return { ...state, isHydrated: true, error: action.error,
      addresses: action.error.code === 'UNAUTHENTICATED' ? [] : state.addresses };
  }
  if (state.error?.code === 'UNAUTHENTICATED') return state;
  if (action.type === 'loaded') return { ...state, addresses: action.addresses, isHydrated: true, error: null };
  if (action.type === 'removed') {
    return { ...state, addresses: normalizeDefaults(state.addresses.filter((address) => address.id !== action.id)), isHydrated: true, error: null };
  }
  const addresses = state.addresses.map((address) => address.id === action.address.id ? action.address
    : action.address.isDefault ? { ...address, isDefault: false } : address);
  if (!addresses.some((address) => address.id === action.address.id)) addresses.push(action.address);
  return { ...state, addresses: normalizeDefaults(addresses), isHydrated: true, error: null };
}

export function visibleAccountAddresses(state: AccountAddressesState, sessionKey: string) {
  return state.sessionKey === sessionKey ? state : emptyAccountAddresses;
}
