import type { ProductFilter } from '@/services/api/catalog-api';

/**
 * What the customer can narrow and order the product list by. To add a filter later, add a field
 * here, a line in `toProductFilter` and `countActiveFilters`, and a section in the filter sheet.
 */

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export type ProductFilterState = {
  sort: SortOption;
  /** Slug of the chosen category, or null for all. */
  categorySlug: string | null;
  newArrivalsOnly: boolean;
  popularOnly: boolean;
  inStockOnly: boolean;
  /** Price range in whole rupees, or null for no limit on that side. */
  minPrice: number | null;
  maxPrice: number | null;
};

export const DEFAULT_FILTERS: ProductFilterState = {
  sort: 'newest',
  categorySlug: null,
  newArrivalsOnly: false,
  popularOnly: false,
  inStockOnly: false,
  minPrice: null,
  maxPrice: null,
};

export const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Under ₹200', min: null, max: 200 },
  { label: '₹200 – ₹500', min: 200, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: 'Above ₹1,000', min: 1000, max: null },
];

const RUPEES_TO_PAISE = 100;

/** The request the server understands. Prices go out as paise, like everywhere else. */
export function toProductFilter(state: ProductFilterState): ProductFilter {
  return {
    ...(state.categorySlug ? { categorySlug: state.categorySlug } : {}),
    ...(state.newArrivalsOnly ? { isNew: true } : {}),
    ...(state.popularOnly ? { featured: true } : {}),
    ...(state.inStockOnly ? { inStock: true } : {}),
    ...(state.minPrice !== null ? { minPricePaise: state.minPrice * RUPEES_TO_PAISE } : {}),
    ...(state.maxPrice !== null ? { maxPricePaise: state.maxPrice * RUPEES_TO_PAISE } : {}),
    sort: state.sort,
  };
}

/** Identifies a list: changes whenever anything that changes the products changes. */
export function filterKey(state: ProductFilterState): string {
  return JSON.stringify(state);
}

/** How many filters are narrowing the list. Sorting does not count: it only reorders. */
export function countActiveFilters(state: ProductFilterState): number {
  return (
    (state.categorySlug ? 1 : 0) +
    (state.newArrivalsOnly ? 1 : 0) +
    (state.popularOnly ? 1 : 0) +
    (state.inStockOnly ? 1 : 0) +
    (state.minPrice !== null || state.maxPrice !== null ? 1 : 0)
  );
}

export function describeSort(sort: SortOption): string {
  return SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Newest first';
}

/** Whole rupees from what was typed, or null for an empty box. NaN when it is not a valid amount. */
export function parseRupees(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  return /^\d{1,7}$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}
