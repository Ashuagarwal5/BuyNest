import { apiRequest } from '@/services/api/client';
import {
  asArray,
  asBoolean,
  asInteger,
  asNullableInteger,
  asNullableString,
  asObject,
  asString,
} from '@/services/api/parse';
import type { Category, Product } from '@/types/catalog';
import type { DeliveryArea } from '@/types/delivery';

/** The API's page-size ceiling; the app's lists are small enough to load in one page. */
const MAX_PAGE_SIZE = 50;
/** Products per page in the scrolling lists: enough to fill a screen, small enough to load quickly. */
const PAGE_SIZE = 20;

function parseCategory(value: unknown): Category {
  const dto = asObject(value);
  return {
    id: asString(dto.id),
    name: asString(dto.name),
    slug: asString(dto.slug),
    description: asNullableString(dto.description) ?? '',
    imageUrl: asNullableString(dto.imageUrl),
    displayOrder: asInteger(dto.displayOrder),
  };
}

/** Converts the API's product shape into the app's, so screens do not depend on API field names. */
function parseProduct(value: unknown): Product {
  const dto = asObject(value);
  const category = asObject(dto.category);
  // A server that predates videos sends no mediaType, and everything it sends is a picture.
  const media = asArray(dto.images, (item) => {
    const entry = asObject(item);
    return { url: asString(entry.url), isVideo: entry.mediaType === 'VIDEO' };
  });
  return {
    id: asString(dto.id),
    name: asString(dto.name),
    slug: asString(dto.slug),
    description: asString(dto.description),
    categoryId: asString(category.id),
    categorySlug: asString(category.slug),
    categoryName: asString(category.name),
    images: media.filter((item) => !item.isVideo).map((item) => item.url),
    videos: media.filter((item) => item.isVideo).map((item) => item.url),
    mrp: asInteger(dto.mrpPaise),
    sellingPrice: asInteger(dto.sellingPricePaise),
    stockQuantity: Math.max(asInteger(dto.availableQuantity), 0),
    isFeatured: asBoolean(dto.isFeatured),
    isNew: asBoolean(dto.isNew),
  };
}

function parseDeliveryArea(value: unknown): DeliveryArea {
  const dto = asObject(value);
  return {
    id: asString(dto.id),
    name: asString(dto.name),
    pincode: asNullableString(dto.pincode) ?? undefined,
    deliveryCharge: asInteger(dto.deliveryChargePaise),
    minimumOrder: asNullableInteger(dto.minimumOrderPaise) ?? undefined,
    freeDeliveryThreshold: asNullableInteger(dto.freeDeliveryThresholdPaise) ?? undefined,
  };
}

export function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  return apiRequest('/categories', { signal, parse: (data) => asArray(data, parseCategory) });
}

export type ProductFilter = {
  categorySlug?: string;
  featured?: boolean;
  isNew?: boolean;
  /** Matches product names and descriptions. */
  search?: string;
};

function productQuery(filter: ProductFilter, page: number, limit: number): string {
  const query = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (filter.categorySlug) {
    query.set('category', filter.categorySlug);
  }
  if (filter.search) {
    query.set('search', filter.search);
  }
  if (filter.featured) {
    query.set('featured', 'true');
  }
  if (filter.isNew) {
    query.set('new', 'true');
  }
  return query.toString();
}

export function fetchProducts(filter: ProductFilter, signal?: AbortSignal): Promise<Product[]> {
  return apiRequest(`/products?${productQuery(filter, 1, MAX_PAGE_SIZE)}`, {
    signal,
    parse: (data) => asArray(asObject(data).items, parseProduct),
  });
}

export type ProductPage = { items: Product[]; hasMore: boolean };

/** One page of a long list. The list screens ask for the next page as the customer scrolls. */
export function fetchProductPage(filter: ProductFilter, page: number, signal?: AbortSignal): Promise<ProductPage> {
  return apiRequest(`/products?${productQuery(filter, page, PAGE_SIZE)}`, {
    signal,
    parse: (data) => {
      const dto = asObject(data);
      const pagination = asObject(dto.pagination);
      return {
        items: asArray(dto.items, parseProduct),
        hasMore: asInteger(pagination.page) < asInteger(pagination.totalPages),
      };
    },
  });
}

/** Exactly these products (at most 50), as they are now. Unknown or unavailable ids are left out. */
export function fetchProductsByIds(ids: string[], signal?: AbortSignal): Promise<Product[]> {
  if (ids.length === 0) {
    return Promise.resolve([]);
  }
  const query = new URLSearchParams({ ids: ids.join(','), limit: String(MAX_PAGE_SIZE) });
  return apiRequest(`/products?${query.toString()}`, {
    signal,
    parse: (data) => asArray(asObject(data).items, parseProduct),
  });
}

/** `identifier` is a product id or slug; the API accepts either. */
export function fetchProduct(identifier: string, signal?: AbortSignal): Promise<Product> {
  return apiRequest(`/products/${encodeURIComponent(identifier)}`, { signal, parse: parseProduct });
}

export function fetchDeliveryAreas(signal?: AbortSignal): Promise<DeliveryArea[]> {
  return apiRequest('/delivery-areas', {
    signal,
    parse: (data) => asArray(data, parseDeliveryArea),
  });
}

/** For troubleshooting the connection; resolves when the API and its database are up. */
export function checkApiHealth(signal?: AbortSignal): Promise<void> {
  return apiRequest('/health', {
    signal,
    unversioned: true,
    parse: (data) => {
      asString(asObject(data).status);
    },
  });
}
