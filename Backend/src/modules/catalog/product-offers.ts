import type { Prisma } from '../../generated/prisma/client.js';
import { conflict, notFound } from '../../lib/errors.js';
import type { TransactionClient } from '../../lib/prisma.js';
import { calculateLineTotal } from '../../lib/pricing.js';

export const offerInclude = {
  variants: { orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }] },
  comboComponents: { include: { product: { include: { category: { select: { isActive: true } } } } }, orderBy: { productId: 'asc' as const } },
} satisfies Prisma.ProductInclude;
type OfferProduct = Prisma.ProductGetPayload<{ include: typeof offerInclude }>;
type StockFields = { stockQuantity: number; reservedQuantity: number; allowBackorder: boolean };

/** What a backorderable product offers once its stock runs out: the most one order line may ask for. */
export const BACKORDER_ORDERABLE_UNITS = 999;

/** Units of one ordinary product customers may order right now. Backorders keep it above zero. */
export function orderableUnits(product: StockFields): number {
  const free = product.stockQuantity - product.reservedQuantity;
  return product.allowBackorder ? Math.max(free, BACKORDER_ORDERABLE_UNITS) : free;
}

/** Units of one ordinary product on the shelf and not yet promised: what can be delivered without a restock. */
export function readyUnits(product: StockFields): number {
  return Math.max(product.stockQuantity - product.reservedQuantity, 0);
}

/** How many of an offer can be ordered (by default) or delivered from stock now (with `readyUnits`). */
export function offerAvailability(product: OfferProduct, units: (product: StockFields) => number = orderableUnits): number {
  if (product.kind === 'STANDARD') return units(product);
  if (product.comboComponents.length < 2) return 0;
  return Math.min(...product.comboComponents.map(c => c.product.kind !== 'STANDARD' || !c.product.isActive || !c.product.category.isActive ? 0 : Math.floor(units(c.product) / c.quantity)));
}
export function offerDetails(product: OfferProduct, publicView = false) {
  const available = offerAvailability(product);
  const ready = offerAvailability(product, readyUnits);
  const usable = (c: OfferProduct['comboComponents'][number]) => c.product.kind === 'STANDARD' && c.product.isActive && c.product.category.isActive;
  return {
    kind: product.kind,
    variants: product.variants.filter(v => !publicView || v.isActive).map(v => ({ ...v, availableQuantity: Math.floor(available / v.unitsPerPack), readyQuantity: Math.floor(ready / v.unitsPerPack) })),
    comboComponents: product.comboComponents.map(c => ({ productId: c.productId, quantity: c.quantity, productName: c.product.name, sku: c.product.sku, availableQuantity: usable(c) ? orderableUnits(c.product) : 0, readyQuantity: usable(c) ? readyUnits(c.product) : 0 })),
  };
}
export type ComponentSnapshot = { productId: string; productName: string; sku: string; unitsPerPack: number };
export type StockLine = { productId: string; quantity: number };
export function physicalLines(items: { productId: string; quantity: number; components?: { productId: string; unitsPerPack: number }[] }[]): StockLine[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const components = item.components?.length ? item.components : [{ productId: item.productId, unitsPerPack: 1 }];
    for (const c of components) {
      const next = (totals.get(c.productId) ?? 0) + c.unitsPerPack * item.quantity;
      if (!Number.isSafeInteger(next) || next > 2147483647) throw conflict('QUANTITY_LIMIT', 'The requested quantity is too large.');
      totals.set(c.productId, next);
    }
  }
  return [...totals].map(([productId, quantity]) => ({ productId, quantity })).sort((a,b) => a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0);
}

/** Locks the catalog definitions and physical stock in one global product-id order.
 * All combo/variant edits take the same parent lock. Re-read after locks to detect
 * composition changes while discovering the lock set, before making reservations. */
export async function resolveOrderOffers(tx: TransactionClient, items: { productId: string; variantId?: string; quantity: number }[]) {
  const ids = [...new Set(items.map(i => i.productId))];
  const first = await tx.product.findMany({ where: { id: { in: ids } }, include: offerInclude });
  const lockIds = [...new Set([...ids, ...first.flatMap(p => p.comboComponents.map(c => c.productId))])].sort();
  for (const id of lockIds) await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${id} FOR UPDATE`;
  const products = await tx.product.findMany({ where: { id: { in: ids } }, include: { ...offerInclude, category: { select: { isActive: true } }, images: { where: { mediaType: 'IMAGE' }, orderBy: { displayOrder: 'asc' }, take: 1 } } });
  return items.map(item => {
    const p = products.find(p => p.id === item.productId);
    if (!p) throw notFound('PRODUCT_NOT_FOUND', 'A product in your cart does not exist.');
    if (!p.isActive || !p.category.isActive) throw conflict('PRODUCT_UNAVAILABLE', `${p.name} is no longer available.`, { productId: p.id });
    const variant = item.variantId ? p.variants.find(v => v.id === item.variantId && v.isActive) : undefined;
    if (item.variantId && (!variant || p.kind !== 'STANDARD')) throw conflict('PRODUCT_UNAVAILABLE', 'This pack is no longer available for this product.', { productId: p.id, variantId: item.variantId });
    const components: ComponentSnapshot[] = p.kind === 'COMBO' ? p.comboComponents.map(c => ({ productId: c.productId, productName: c.product.name, sku: c.product.sku, unitsPerPack: c.quantity })) : [{ productId: p.id, productName: p.name, sku: p.sku, unitsPerPack: variant?.unitsPerPack ?? 1 }];
    if (p.kind === 'COMBO' && (components.length < 2 || p.comboComponents.some(c => c.product.kind !== 'STANDARD' || !c.product.isActive || !c.product.category.isActive))) throw conflict('PRODUCT_UNAVAILABLE', `${p.name} has unavailable contents.`, { productId: p.id });
    if (components.some(c => !lockIds.includes(c.productId))) throw conflict('CATALOG_CHANGED', 'The combo contents changed. Refresh your cart and try again.');
    const price = variant?.sellingPricePaise ?? p.sellingPricePaise;
    return { productId: p.id, variantId: variant?.id ?? null, packLabel: variant?.label ?? (p.kind === 'COMBO' ? 'Combo pack' : null), productName: p.name, sku: variant?.sku ?? p.sku, productImage: p.images[0]?.url ?? null, unitPricePaise: price, quantity: item.quantity, lineTotalPaise: calculateLineTotal(price, item.quantity), components };
  });
}
