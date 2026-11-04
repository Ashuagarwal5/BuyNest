/**
 * Replaces the placeholder pictures of the starter catalog with real photos, one photo per
 * sub-category (every product in that sub-category shares it).
 *
 *   npx tsx scripts/apply-catalog-photos.ts <photo-folder>
 *
 * <photo-folder> holds one sub-folder per sub-category slug, each with numbered JPEGs (1.jpg, 2.jpg
 * ...). PICKS below says which numbered photo to use. Sub-categories not listed keep their
 * placeholder. Only products created by seed-catalog.ts are touched (matched by SKU), and only their
 * picture rows change. Safe to run twice.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '../src/lib/prisma.js';
import { saveMedia } from '../src/modules/media/media-storage.js';
import { SUB_CATEGORIES } from './catalog-seed-data.js';

/** sub-category slug -> number of the chosen photo. Left out = keep the placeholder. */
const PICKS: Record<string, number> = {
  'notebooks-diaries': 2,
  'pens-pencils': 3,
  'art-craft': 2,
  'desk-office': 4,
  'school-supplies': 2,
  'mugs-bottles': 2,
  'photo-frames': 1,
  'greeting-wrapping': 1,
  'keychains-accessories': 3,
  'soft-toys': 4,
  'cars-vehicles': 3,
  'puzzles-games': 2,
  'building-blocks': 1,
  'educational-toys': 1,
  cricket: 1,
  badminton: 3,
  'fitness-indoor': 1,
  'welcome-decor': 1,
  'birthday-decor': 2,
  'anniversary-decor': 4,
  'baby-shower-decor': 4,
  'wedding-festive-decor': 2,
  'party-lights-props': 3,
  'deodorants-body-sprays': 1,
  'perfume-sprays': 3,
  'fragrance-gift-sets': 2,
};

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    throw new Error('Usage: npx tsx scripts/apply-catalog-photos.ts <photo-folder>');
  }

  let updated = 0;
  for (const sub of SUB_CATEGORIES) {
    const pick = PICKS[sub.slug];
    if (!pick) {
      console.log(`  - ${sub.name}: keeps its placeholder`);
      continue;
    }
    const url = await saveMedia(await readFile(path.join(folder, sub.slug, `${pick}.jpg`)), {
      kind: 'IMAGE',
      extension: 'jpg',
    });

    for (const [index] of sub.rows.entries()) {
      const sku = `DK-${sub.code}-${String(index + 1).padStart(3, '0')}`;
      const product = await prisma.product.findUnique({ where: { sku }, select: { id: true, name: true } });
      if (!product) {
        continue;
      }
      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: product.id } }),
        prisma.productImage.create({
          data: { productId: product.id, url, mediaType: 'IMAGE', altText: product.name, displayOrder: 0 },
        }),
      ]);
      updated += 1;
    }
    console.log(`  + ${sub.name}: photo ${pick} applied`);
  }
  console.log(`Done: ${updated} products now have a real photo.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
