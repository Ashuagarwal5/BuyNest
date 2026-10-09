import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  type AddressDraft,
  MAX_SAVED_ADDRESSES,
  type SavedAddress,
} from '@/features/addresses/address-types';
import {
  loadAddresses,
  normaliseDefaults,
  saveAddresses,
} from '@/features/addresses/addresses-storage';

type AddressesContextValue = {
  addresses: SavedAddress[];
  /** False until the saved addresses have been read; the book is usable (and empty) meanwhile. */
  isHydrated: boolean;
  /** Saves a new address. 'full' means the limit was reached. The first address becomes the default. */
  add: (draft: AddressDraft) => SavedAddress | 'full';
  update: (id: string, draft: AddressDraft) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
};

const AddressesContext = createContext<AddressesContextValue | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** The customer's saved delivery addresses. They live on this phone, like the cart. */
export function AddressesProvider({ children }: PropsWithChildren) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;
    loadAddresses().then((saved) => {
      if (isActive) {
        setAddresses(saved);
        setIsHydrated(true);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    // Saving before the stored book has been read would overwrite it with an empty one.
    if (isHydrated) {
      void saveAddresses(addresses);
    }
  }, [isHydrated, addresses]);

  const add = useCallback(
    (draft: AddressDraft): SavedAddress | 'full' => {
      if (addresses.length >= MAX_SAVED_ADDRESSES) {
        return 'full';
      }
      const created: SavedAddress = {
        ...draft,
        id: newId(),
        isDefault: draft.isDefault || addresses.length === 0,
      };
      setAddresses((current) =>
        normaliseDefaults([
          ...current.map((address) =>
            created.isDefault ? { ...address, isDefault: false } : address,
          ),
          created,
        ]),
      );
      return created;
    },
    [addresses.length],
  );

  const update = useCallback((id: string, draft: AddressDraft) => {
    setAddresses((current) =>
      normaliseDefaults(
        current.map((address) => {
          if (address.id === id) {
            return { ...draft, id };
          }
          return draft.isDefault ? { ...address, isDefault: false } : address;
        }),
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    // If the default is removed, the first one left becomes the default.
    setAddresses((current) => normaliseDefaults(current.filter((address) => address.id !== id)));
  }, []);

  const setDefault = useCallback((id: string) => {
    setAddresses((current) =>
      current.map((address) => ({ ...address, isDefault: address.id === id })),
    );
  }, []);

  const value = useMemo(
    () => ({ addresses, isHydrated, add, update, remove, setDefault }),
    [addresses, isHydrated, add, update, remove, setDefault],
  );

  return <AddressesContext value={value}>{children}</AddressesContext>;
}

export function useAddresses(): AddressesContextValue {
  const value = use(AddressesContext);
  if (!value) {
    throw new Error('useAddresses must be used inside <AddressesProvider>');
  }
  return value;
}
