import { randomUUID } from 'node:crypto';

import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

export { prisma };

export const app = createApp();

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE "InventoryTransaction", "OrderStatusHistory", "OrderItem", "Order", "OrderCounter",
             "Customer", "ProductImage", "Product", "Category", "DeliveryArea"
    CASCADE
  `;
}

/** A small, known catalogue. Prices are chosen so expected totals are easy to check by hand. */
export async function seedFixtures() {
  const stationery = await prisma.category.create({
    data: { name: 'Stationery', slug: 'stationery', displayOrder: 2 },
  });
  const toys = await prisma.category.create({
    data: { name: 'Toys', slug: 'toys', displayOrder: 1 },
  });
  const hiddenCategory = await prisma.category.create({
    data: { name: 'Hidden', slug: 'hidden', displayOrder: 3, isActive: false },
  });

  const product = (
    sku: string,
    name: string,
    categoryId: string,
    sellingPricePaise: number,
    stockQuantity: number,
    extra: { isActive?: boolean; isFeatured?: boolean; isNew?: boolean } = {}
  ) =>
    prisma.product.create({
      data: {
        sku,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${name} description`,
        categoryId,
        mrpPaise: sellingPricePaise + 5000,
        sellingPricePaise,
        stockQuantity,
        ...extra,
      },
    });

  const products = {
    // ₹349.00, featured
    notebook: await product('T-001', 'Classmate Notebook', stationery.id, 34900, 10, {
      isFeatured: true,
    }),
    // ₹149.50: a price with paise, to catch any floating point money maths
    pencil: await product('T-002', 'Pencil Pack', stationery.id, 14950, 100, { isNew: true }),
    lastOne: await product('T-003', 'Remote Car', toys.id, 69900, 1),
    soldOut: await product('T-004', 'Teddy Bear', toys.id, 44900, 0),
    inactive: await product('T-005', 'Retired Toy', toys.id, 9900, 5, { isActive: false }),
    inHiddenCategory: await product('T-006', 'Hidden Thing', hiddenCategory.id, 9900, 5),
  };

  await prisma.productImage.create({
    data: { productId: products.notebook.id, url: 'https://example.test/notebook.jpg' },
  });

  const areas = {
    // ₹30 delivery, free from ₹500
    standard: await prisma.deliveryArea.create({
      data: { name: 'Station Road', deliveryChargePaise: 3000, freeDeliveryThresholdPaise: 50000 },
    }),
    // ₹40 delivery, minimum order ₹200
    withMinimum: await prisma.deliveryArea.create({
      data: { name: 'Model Town', deliveryChargePaise: 4000, minimumOrderPaise: 20000 },
    }),
    inactive: await prisma.deliveryArea.create({
      data: { name: 'Industrial Area', deliveryChargePaise: 5000, isActive: false },
    }),
  };

  return { categories: { stationery, toys, hiddenCategory }, products, areas };
}

export type Fixtures = Awaited<ReturnType<typeof seedFixtures>>;

type OrderPayloadOptions = {
  deliveryAreaId: string;
  items: { productId: string; quantity: number }[];
  clientRequestId?: string;
  mobile?: string;
};

export function orderPayload(options: OrderPayloadOptions) {
  return {
    clientRequestId: options.clientRequestId ?? randomUUID(),
    customer: { fullName: 'Ravi Kumar', mobile: options.mobile ?? '9876543210' },
    address: {
      addressLine1: '12 Shastri Street',
      addressLine2: '',
      landmark: 'Near the temple',
      city: 'Testpur',
      pincode: '226001',
    },
    deliveryAreaId: options.deliveryAreaId,
    items: options.items,
    paymentMethod: 'COD',
  };
}

export async function getStock(productId: string) {
  return prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { stockQuantity: true, reservedQuantity: true },
  });
}
