import { offerInclude, offerAvailability, offerDetails, readyUnits } from './product-offers.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import type { ListProductsQuery } from './catalog.schemas.js';

/** Only what customers may see: nothing inactive, and no internal stock bookkeeping. */
const publicProductInclude = {
  ...offerInclude,
  category: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
  images: { orderBy: { displayOrder: 'asc' }, select: { url: true, altText: true, mediaType: true } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof publicProductInclude }>;

function toPublicProduct(product: ProductWithRelations) {
  // Never negative: a product without backorders keeps reservedQuantity <= stockQuantity,
  // and a backorderable one reports what may still be ordered.
  const availableQuantity = offerAvailability(product);
  // Below availableQuantity only while backorders are being taken: the rest wait for a restock.
  const readyQuantity = offerAvailability(product, readyUnits);

  return {
    ...offerDetails(product, true),
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    brand: product.brand,
    mrpPaise: product.mrpPaise,
    sellingPricePaise: product.sellingPricePaise,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    availableQuantity,
    readyQuantity,
    inStock: availableQuantity > 0,
    // Orderable, but the shop restocks before it can deliver.
    isBackorder: availableQuantity > 0 && readyQuantity === 0,
    category: product.category,
    images: product.images,
  };
}

const ORDER_BY: Record<ListProductsQuery['sort'], Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }, { id: 'asc' }],
  price_asc: [{ sellingPricePaise: 'asc' }, { id: 'asc' }],
  price_desc: [{ sellingPricePaise: 'desc' }, { id: 'asc' }],
  name_asc: [{ name: 'asc' }, { id: 'asc' }],
};

const activeProductWhere = {
  isActive: true,
  category: { isActive: true },
} satisfies Prisma.ProductWhereInput;

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      displayOrder: true,
      parentId: true,
    },
  });
}

/** Distinct brand names of products customers can see, for a brand filter. */
export async function listBrands() {
  const rows = await prisma.product.findMany({
    where: { ...activeProductWhere, brand: { not: null } },
    distinct: ['brand'],
    select: { brand: true },
    orderBy: { brand: 'asc' },
  });
  return rows.map((row) => row.brand as string);
}

export async function listProducts(query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = {
    ...activeProductWhere,
    // A parent category also lists the products of its subcategories.
    ...(query.category
      ? { category: { isActive: true, OR: [{ slug: query.category }, { parent: { slug: query.category } }] } }
      : {}),
    ...(query.brand ? { brand: { equals: query.brand, mode: 'insensitive' as const } } : {}),
    ...(query.ids ? { id: { in: query.ids } } : {}),
    ...(query.minPrice === undefined && query.maxPrice === undefined
      ? {}
      : {
          sellingPricePaise: {
            ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
            ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice }),
          },
        }),
    // Available = on hand minus reserved by open orders, compared column to column in the database.

    ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
    ...(query.new === undefined ? {} : { isNew: query.new }),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { brand: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  if (query.inStock) {
    const rows = await prisma.$queryRaw<{id:string}[]>`
      SELECT p."id" FROM "Product" p WHERE
      (p."kind" = 'STANDARD' AND (p."allowBackorder" OR p."stockQuantity" > p."reservedQuantity")) OR
      (p."kind" = 'COMBO' AND (SELECT count(*) FROM "ComboComponent" c WHERE c."comboId" = p."id") >= 2
       AND NOT EXISTS (SELECT 1 FROM "ComboComponent" c JOIN "Product" b ON b."id" = c."productId" JOIN "Category" cat ON cat."id" = b."categoryId"
         WHERE c."comboId" = p."id" AND (b."kind" <> 'STANDARD' OR NOT b."isActive" OR NOT cat."isActive" OR (NOT b."allowBackorder" AND b."stockQuantity" - b."reservedQuantity" < c."quantity"))))
    `;
    const availableIds = rows.map(r => r.id);
    where.id = {in: availableIds.filter(id => !query.ids || query.ids.includes(id))};
  }
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      // Every order ends with `id`, so ties never make pages overlap or skip rows.
      orderBy: ORDER_BY[query.sort],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: products.map(toPublicProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/** `identifier` is the product slug (preferred, stable in links) or its id. */
export async function getProduct(identifier: string) {
  const product = await prisma.product.findFirst({
    where: { ...activeProductWhere, OR: [{ slug: identifier }, { id: identifier }] },
    include: publicProductInclude,
  });

  if (!product) {
    throw notFound('PRODUCT_NOT_FOUND', 'This product does not exist or is no longer available.');
  }
  return toPublicProduct(product);
}

export async function listDeliveryAreas() {
  return prisma.deliveryArea.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      pincode: true,
      deliveryChargePaise: true,
      minimumOrderPaise: true,
      freeDeliveryThresholdPaise: true,
    },
  });
}
