/**
 * The one place order amounts are calculated, shared by Cart, Checkout and order creation.
 * Everything is integer paise, so there is no floating point money arithmetic.
 * These are client-side figures: once the backend exists it recalculates every amount
 * and its numbers are the authoritative ones.
 */

import type { DeliveryArea } from '@/types/delivery';

type PricedLine = {
  unitPrice: number;
  quantity: number;
};

type DeliveryRule = Pick<DeliveryArea, 'deliveryCharge' | 'freeDeliveryThreshold' | 'minimumOrder'>;

export type OrderTotals = {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
};

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

export function calculateSubtotal(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + calculateLineTotal(line.unitPrice, line.quantity), 0);
}

export function calculateDeliveryCharge(subtotal: number, area: DeliveryRule): number {
  const isFree =
    area.freeDeliveryThreshold !== undefined && subtotal >= area.freeDeliveryThreshold;
  return isFree ? 0 : area.deliveryCharge;
}

export function calculateGrandTotal(amounts: Omit<OrderTotals, 'grandTotal'>): number {
  return amounts.subtotal + amounts.deliveryCharge - amounts.discount;
}

export function calculateOrderTotals(lines: PricedLine[], area: DeliveryRule): OrderTotals {
  const subtotal = calculateSubtotal(lines);
  const deliveryCharge = calculateDeliveryCharge(subtotal, area);
  // Coupons do not exist yet; the field is here so orders have a stable shape when they do.
  const discount = 0;

  return {
    subtotal,
    deliveryCharge,
    discount,
    grandTotal: calculateGrandTotal({ subtotal, deliveryCharge, discount }),
  };
}

/** How much more to spend for free delivery in this area; 0 if already free or not offered. */
export function getAmountToFreeDelivery(subtotal: number, area: DeliveryRule): number {
  if (area.freeDeliveryThreshold === undefined) {
    return 0;
  }
  return Math.max(area.freeDeliveryThreshold - subtotal, 0);
}

/** How far the subtotal is below the area's minimum order; 0 when the minimum is met. */
export function getAmountToMinimumOrder(subtotal: number, area: DeliveryRule): number {
  if (area.minimumOrder === undefined) {
    return 0;
  }
  return Math.max(area.minimumOrder - subtotal, 0);
}
