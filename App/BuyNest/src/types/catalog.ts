export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  /** Image URLs, first one is the primary image. Empty until real images are uploaded. */
  images: string[];
  /** Money is always integer paise (₹199 = 19900), matching what the backend will store. */
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  isFeatured: boolean;
  isNew: boolean;
  rating: number | null;
};
