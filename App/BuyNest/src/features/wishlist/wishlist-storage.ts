import { readJson, StorageKeys, writeJson } from '@/services/storage';

/** The most products a wishlist holds. Matches what the server returns for one lookup. */
export const MAX_WISHLIST_ITEMS = 50;

/** The saved ids. Anything that is not a list of strings counts as an empty wishlist. */
export async function loadWishlistIds(): Promise<string[]> {
  const result = await readJson(StorageKeys.wishlist);
  if (!result.ok || !Array.isArray(result.value)) {
    return [];
  }
  const ids = result.value.filter(
    (value): value is string => typeof value === 'string' && value !== '',
  );
  return [...new Set(ids)].slice(0, MAX_WISHLIST_ITEMS);
}

export function saveWishlistIds(ids: string[]): Promise<boolean> {
  return writeJson(StorageKeys.wishlist, ids);
}
