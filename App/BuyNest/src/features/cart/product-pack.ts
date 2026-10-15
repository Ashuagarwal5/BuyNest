import type { Product } from '../../types/catalog';

export function cartProductKey(product: {id:string;variantId?:string}): string {
  return product.variantId ? JSON.stringify([product.id, product.variantId]) : product.id;
}
export function selectProductPack(product:Product, variantId?:string):Product {
  if (!variantId) return product;
  const variant=product.variants?.find(v=>v.id===variantId);
  if (!variant) return {...product,variantId,stockQuantity:0};
  return {...product,variantId,baseName:product.name,name:`${product.name} - ${variant.label}`,packLabel:variant.label,unitsPerPack:variant.unitsPerPack,physicalStockQuantity:product.stockQuantity,mrp:variant.mrp,sellingPrice:variant.sellingPrice,stockQuantity:variant.availableQuantity};
}

type Entry = {product:Product;quantity:number};
function components(product:Product) {
  return product.kind === 'COMBO' ? (product.comboComponents ?? []).map(c=>({id:c.productId,units:c.quantity,available:c.availableQuantity})) : [{id:product.id,units:product.unitsPerPack ?? 1,available:product.physicalStockQuantity ?? product.stockQuantity}];
}
export function cartRemainingPacks(product:Product, entries:Entry[]):number {
  const content=components(product);
  if(!content.length)return 0;
  const used=new Map<string,number>();
  for(const entry of entries) for(const c of components(entry.product)) used.set(c.id,(used.get(c.id) ?? 0)+c.units*entry.quantity);
  return Math.max(0,Math.min(product.stockQuantity,...content.map(c=>Math.floor((c.available-(used.get(c.id) ?? 0))/c.units))));
}
export function cartStockIssue(product:Product,entries:Entry[]):string|null {
  const content=components(product);
  const used=new Map<string,number>();
  for(const entry of entries)for(const c of components(entry.product))used.set(c.id,(used.get(c.id) ?? 0)+c.units*entry.quantity);
  return content.some(c=>(used.get(c.id) ?? 0)>c.available) ? 'Your packs and combos need more shared stock than is available. Reduce a quantity.' : null;
}
