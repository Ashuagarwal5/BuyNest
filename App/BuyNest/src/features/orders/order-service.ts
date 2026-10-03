/**
 * Builds an order from the cart and checkout details. Pure: no storage and no React.
 * This stands in for the backend's "create order" endpoint, which will later own these
 * checks, the totals and the order number.
 *
 * Stock is only checked here, never reduced: mock products are not a real inventory, so
 * placing a local order leaves `stockQuantity` unchanged.
 */

import { getDeliveryAreaById } from '@/data/delivery-areas';
import { getProductById } from '@/data/products';
import {
  type CheckoutDetails,
  hasErrors,
  normalizeMobileNumber,
  validateCheckoutDetails,
} from '@/features/checkout/checkout-details';
import type { Order, OrderItem, PaymentMethod } from '@/types/order';
import { formatCurrency } from '@/utils/money';
import { calculateLineTotal, calculateOrderTotals, getAmountToMinimumOrder } from '@/utils/pricing';

export type OrderDraft = {
  lines: { productId: string; quantity: number }[];
  details: CheckoutDetails;
  paymentMethod: PaymentMethod;
};

export type BuildOrderResult = { ok: true; order: Order } | { ok: false; message: string };

const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = ['COD'];
const FIRST_DAILY_SEQUENCE = 1001;

function fail(message: string): BuildOrderResult {
  return { ok: false, message };
}

/** e.g. BN-20261003-1001: date placed plus a per-day sequence that continues from existing orders. */
export function generateOrderNumber(existingOrders: Order[], now: Date): string {
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const prefix = `BN-${datePart}-`;

  const lastSequence = existingOrders.reduce((highest, order) => {
    if (!order.orderNumber.startsWith(prefix)) {
      return highest;
    }
    const sequence = Number(order.orderNumber.slice(prefix.length));
    return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
  }, FIRST_DAILY_SEQUENCE - 1);

  return `${prefix}${lastSequence + 1}`;
}

function generateOrderId(now: Date): string {
  return `order-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildOrder(draft: OrderDraft, existingOrders: Order[], now: Date): BuildOrderResult {
  if (draft.lines.length === 0) {
    return fail('Your cart is empty.');
  }

  const items: OrderItem[] = [];
  for (const line of draft.lines) {
    const product = getProductById(line.productId);
    if (!product) {
      return fail('A product in your cart is no longer available. Please remove it and try again.');
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return fail(`The quantity for ${product.name} is not valid.`);
    }
    if (line.quantity > product.stockQuantity) {
      return fail(
        product.stockQuantity === 0
          ? `${product.name} is out of stock. Please remove it from your cart.`
          : `Only ${product.stockQuantity} of ${product.name} available. Please reduce the quantity.`
      );
    }
    items.push({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] ?? null,
      quantity: line.quantity,
      unitPrice: product.sellingPrice,
      lineTotal: calculateLineTotal(product.sellingPrice, line.quantity),
    });
  }

  if (hasErrors(validateCheckoutDetails(draft.details))) {
    return fail('Please check your contact and address details.');
  }
  const phone = normalizeMobileNumber(draft.details.phone);
  const area = draft.details.deliveryAreaId
    ? getDeliveryAreaById(draft.details.deliveryAreaId)
    : undefined;
  if (phone === null || !area) {
    return fail('Please check your contact and address details.');
  }
  if (!area.isActive) {
    return fail(`We no longer deliver to ${area.name}. Please choose another delivery area.`);
  }

  if (!SUPPORTED_PAYMENT_METHODS.includes(draft.paymentMethod)) {
    return fail('Please choose a payment method.');
  }

  const totals = calculateOrderTotals(items, area);
  const shortfall = getAmountToMinimumOrder(totals.subtotal, area);
  if (shortfall > 0) {
    return fail(
      `The minimum order for ${area.name} is ${formatCurrency(area.minimumOrder ?? 0)}. Add ${formatCurrency(shortfall)} more to continue.`
    );
  }

  const fullName = draft.details.fullName.trim();

  return {
    ok: true,
    order: {
      id: generateOrderId(now),
      orderNumber: generateOrderNumber(existingOrders, now),
      customerName: fullName,
      customerPhone: phone,
      deliveryAddress: {
        fullName,
        phone,
        addressLine1: draft.details.addressLine1.trim(),
        addressLine2: draft.details.addressLine2.trim(),
        landmark: draft.details.landmark.trim(),
        area: area.name,
        city: draft.details.city.trim(),
        pincode: draft.details.pincode.trim(),
      },
      deliveryAreaId: area.id,
      items,
      ...totals,
      paymentMethod: draft.paymentMethod,
      // COD is only collected at the door, so a new order is never marked as paid.
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      createdAt: now.toISOString(),
    },
  };
}

/** Customers can cancel only until the shop has confirmed the order. */
export function canCancelOrder(order: Order): boolean {
  return order.orderStatus === 'PLACED';
}
