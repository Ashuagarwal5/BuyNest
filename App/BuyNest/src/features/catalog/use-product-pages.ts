import { useState } from 'react';

import { useApiData } from '@/hooks/use-api-data';
import { fetchProductPage, type ProductFilter } from '@/services/api/catalog-api';
import type { Product } from '@/types/catalog';

type MorePages = { key: string; items: Product[]; page: number; hasMore: boolean };

/**
 * A product list that grows as the customer scrolls. The first page loads like any screen
 * (loading, error, retry); `loadMore()` then adds one page at a time. A failure while loading a
 * later page is reported by `moreFailed` and leaves the products already shown in place.
 *
 * `key` must change whenever `filter` does, so a different list starts again from page one.
 */
export function useProductPages(key: string, filter: ProductFilter) {
  const first = useApiData(key, (signal) => fetchProductPage(filter, 1, signal));
  const [more, setMore] = useState<MorePages | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);

  const extra = more?.key === key ? more : null;
  const firstPage = first.status === 'success' ? first.data : null;

  const items = firstPage
    ? [...firstPage.items, ...(extra?.items ?? []).filter((item) => !firstPage.items.some((seen) => seen.id === item.id))]
    : [];
  const hasMore = firstPage ? (extra ? extra.hasMore : firstPage.hasMore) : false;

  const loadMore = async () => {
    if (!firstPage || !hasMore || isLoadingMore) {
      return;
    }
    const page = (extra?.page ?? 1) + 1;
    setIsLoadingMore(true);
    setMoreFailed(false);
    try {
      const next = await fetchProductPage(filter, page);
      setMore((current) => {
        const base = current?.key === key ? current : { key, items: [], page: 1, hasMore: true };
        return { key, items: [...base.items, ...next.items], page, hasMore: next.hasMore };
      });
    } catch {
      setMoreFailed(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const reload = () => {
    setMore(null);
    setMoreFailed(false);
    first.reload();
  };

  return {
    status: first.status,
    error: first.error,
    items,
    hasMore,
    isRefreshing: first.isRefreshing,
    isLoadingMore,
    moreFailed,
    loadMore,
    reload,
  };
}
