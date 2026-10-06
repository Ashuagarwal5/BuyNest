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
  loadWishlistIds,
  MAX_WISHLIST_ITEMS,
  saveWishlistIds,
} from '@/features/wishlist/wishlist-storage';

type WishlistContextValue = {
  /** Saved product ids, newest first. */
  ids: string[];
  count: number;
  /** False until the saved list has been read; the wishlist is usable (and empty) meanwhile. */
  isHydrated: boolean;
  has: (productId: string) => boolean;
  /** Saves the product, or removes it if it is already saved. 'full' means the limit was reached. */
  toggle: (productId: string) => 'added' | 'removed' | 'full';
  remove: (productId: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * The customer's saved products. It lives on the phone, like the cart, so it works without an
 * account. Only ids are kept: the wishlist screen asks the server for the current price and stock.
 */
export function WishlistProvider({ children }: PropsWithChildren) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;
    loadWishlistIds().then((saved) => {
      if (isActive) {
        setIds(saved);
        setIsHydrated(true);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    // Saving before the stored list has been read would overwrite it with an empty one.
    if (isHydrated) {
      void saveWishlistIds(ids);
    }
  }, [isHydrated, ids]);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback(
    (productId: string): 'added' | 'removed' | 'full' => {
      if (ids.includes(productId)) {
        setIds((current) => current.filter((id) => id !== productId));
        return 'removed';
      }
      if (ids.length >= MAX_WISHLIST_ITEMS) {
        return 'full';
      }
      setIds((current) => [productId, ...current.filter((id) => id !== productId)]);
      return 'added';
    },
    [ids],
  );

  const remove = useCallback((productId: string) => {
    setIds((current) => current.filter((id) => id !== productId));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, count: ids.length, isHydrated, has, toggle, remove, clear }),
    [ids, isHydrated, has, toggle, remove, clear],
  );

  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist(): WishlistContextValue {
  const value = use(WishlistContext);
  if (!value) {
    throw new Error('useWishlist must be used inside <WishlistProvider>');
  }
  return value;
}
