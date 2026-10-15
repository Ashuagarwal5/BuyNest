export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
};

/**
 * A product as last received from the server. Money is integer paise (₹199 = 19900).
 * Prices and stock here are for display; the server recalculates both when an order is placed.
 */
export type Product = {
  kind?: 'STANDARD' | 'COMBO';
  variantId?: string;
  packLabel?: string;
  baseName?: string;
  unitsPerPack?: number;
  physicalStockQuantity?: number;
  variants?: {id:string;label:string;unitsPerPack:number;mrp:number;sellingPrice:number;availableQuantity:number}[];
  comboComponents?: {productId:string;productName:string;quantity:number;availableQuantity:number}[];
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  /** Picture addresses, first one is the primary image. May be a path such as /uploads/… (see resolveMediaUrl). */
  images: string[];
  /** Video addresses. Missing in carts saved by older versions of the app. */
  videos?: string[];
  mrp: number;
  sellingPrice: number;
  /** Units a customer can order right now (stock minus units held by other orders). */
  stockQuantity: number;
  isFeatured: boolean;
  isNew: boolean;
};
