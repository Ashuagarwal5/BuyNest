/**
 * Adds the starter catalog (sub-categories and about 230 products with placeholder pictures) to the
 * database in DATABASE_URL.
 *
 *   npm run seed:catalog
 *
 * Safe to run twice: categories are matched by slug and products by SKU, and anything that already
 * exists is left untouched. Products are created through the same service the admin panel uses, so
 * prices, stock history and pictures follow the real rules. Everything it makes can be edited in
 * the admin panel. Data lives in catalog-seed-data.ts.
 */
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { slugify } from '../src/lib/slug.js';
import { createProduct } from '../src/modules/admin/products/admin-products.service.js';
import { saveMedia } from '../src/modules/media/media-storage.js';
import { SUB_CATEGORIES, TOP_CATEGORIES, type TopSlug } from './catalog-seed-data.js';
import type { DemoCategory } from './demo-catalog-data.js';
import { makeDemoPicture } from './demo-pictures.js';

const toPaise = (rupees: number) => Math.round(rupees * 100);

/** The placeholder picture look to use for each top-level category. */
const PICTURE_THEME: Record<TopSlug, DemoCategory> = {
  stationery: 'stationery',
  'gift-items': 'gift-items',
  toys: 'toys',
  'sports-items': 'sports-items',
  'decoration-items': 'decoration-items',
  perfumes: 'gift-items',
};

const GENERIC_BRAND = 'DoorKart';

async function main() {
  const admin = await prisma.adminUser.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  if (!admin) {
    throw new Error('Create an admin first (npm run admin:create): stock changes are recorded against an admin.');
  }

  // Check the data before touching the database.
  for (const sub of SUB_CATEGORIES) {
    for (const [name, , mrp, price] of sub.rows) {
      if (price > mrp) {
        throw new Error(`"${name}": the selling price is higher than the MRP`);
      }
      if (sub.parent === 'perfumes' && price >= 299) {
        throw new Error(`"${name}": perfumes must be under Rs 299`);
      }
    }
  }

  console.log(`Adding the starter catalog to ${new URL(env.databaseUrl).host} (pictures go to ${env.uploadDir})`);

  // Top-level categories: created if missing, never renamed.
  const topIds = new Map<string, string>();
  const existingTop = await prisma.category.count();
  for (const [index, top] of TOP_CATEGORIES.entries()) {
    const found = await prisma.category.findUnique({ where: { slug: top.slug }, select: { id: true } });
    const category =
      found ??
      (await prisma.category.create({
        data: { ...top, displayOrder: existingTop + index + 1, isActive: true },
        select: { id: true },
      }));
    topIds.set(top.slug, category.id);
    if (!found) {
      console.log(`  + category ${top.name}`);
    }
  }

  const subIds = new Map<string, string>();
  for (const [index, sub] of SUB_CATEGORIES.entries()) {
    const found = await prisma.category.findUnique({ where: { slug: sub.slug }, select: { id: true } });
    const parentId = topIds.get(sub.parent);
    if (!parentId) {
      throw new Error(`Unknown parent category "${sub.parent}"`);
    }
    const category =
      found ??
      (await prisma.category.create({
        data: { name: sub.name, slug: sub.slug, description: sub.description, parentId, displayOrder: index + 1, isActive: true },
        select: { id: true },
      }));
    subIds.set(sub.slug, category.id);
    if (!found) {
      console.log(`  + sub-category ${sub.name}`);
    }
  }

  let created = 0;
  let skipped = 0;
  for (const sub of SUB_CATEGORIES) {
    const categoryId = subIds.get(sub.slug)!;
    for (const [index, [name, brand, mrp, price, stock, description]] of sub.rows.entries()) {
      const sku = `DK-${sub.code}-${String(index + 1).padStart(3, '0')}`;
      if (await prisma.product.findUnique({ where: { sku }, select: { id: true } })) {
        skipped += 1;
        continue;
      }

      // A name like an existing product's would give the same web address, so the SKU is added to it.
      const baseSlug = slugify(name);
      const slug = (await prisma.product.findUnique({ where: { slug: baseSlug }, select: { id: true } }))
        ? `${baseSlug}-${sku.toLowerCase()}`
        : baseSlug;

      const url = await saveMedia(await makeDemoPicture(PICTURE_THEME[sub.parent], name, 0), {
        kind: 'IMAGE',
        extension: 'jpg',
      });

      await createProduct(
        {
          kind: 'STANDARD',
          name,
          slug,
          description,
          categoryId,
          brand: brand === 'Generic' ? GENERIC_BRAND : brand,
          sku,
          mrpPaise: toPaise(mrp),
          sellingPricePaise: toPaise(price),
          stockQuantity: stock,
          lowStockThreshold: 5,
          isFeatured: index === 0,
          isNew: index === 1,
          isActive: true,
          allowBackorder: false,
          procurementCostPaise: null,
          gstRatePercent: null,
          hsnCode: null,
          weightGrams: null,
          lengthMm: null,
          widthMm: null,
          heightMm: null,
          images: [{ url, mediaType: 'IMAGE' as const, altText: name }],
        },
        { id: admin.id, name: admin.name, email: admin.email, role: admin.role, sessionId: 'catalog-seed' }
      );
      created += 1;
    }
    console.log(`  ${sub.name}: ${sub.rows.length} products`);
  }

  console.log(`Done: ${created} products added, ${skipped} already there.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
