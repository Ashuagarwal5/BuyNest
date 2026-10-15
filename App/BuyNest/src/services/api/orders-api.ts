import { apiRequest } from '@/services/api/client';
import { ORDER_REQUEST_TIMEOUT_MS } from '@/services/api/config';
import {
  asArray,
  asInteger,
  asNullableString,
  asObject,
  asOneOf,
  asString,
} from '@/services/api/parse';
import type {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TrackedOrder,
} from '@/types/order';

const ORDER_STATUSES: readonly OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'DELIVERY_FAILED',
];
const PAYMENT_STATUSES: readonly PaymentStatus[] = ['PENDING', 'COLLECTED', 'REFUNDED'];
const PAYMENT_METHODS: readonly PaymentMethod[] = ['COD'];

const TRACKING_TOKEN_HEADER = 'X-Tracking-Token';

/**
 * Everything the app may send when placing an order. There is deliberately no price,
 * total, delivery charge or stock field: the server works all of those out itself and
 * rejects requests that try to supply them.
 */
export type CreateOrderRequest = {
  clientRequestId: string;
  customer: { fullName: string; mobile: string };
  address: {
    addressLine1: string;
    addressLine2: string;
    landmark: string;
    city: string;
    pincode: string;
  };
  deliveryAreaId: string;
  items: { productId: string; variantId?: string; quantity: number }[];
  paymentMethod: PaymentMethod;
};

function parseOrder(value: unknown): Order {
  const dto = asObject(value);
  const address = asObject(dto.deliveryAddress);

  return {
    orderNumber: asString(dto.orderNumber),
    customerName: asString(dto.customerName),
    customerPhone: asString(dto.customerPhone),
    deliveryAddress: {
      addressLine1: asString(address.addressLine1),
      addressLine2: asNullableString(address.addressLine2),
      landmark: asNullableString(address.landmark),
      area: asString(address.area),
      city: asString(address.city),
      pincode: asString(address.pincode),
    },
    items: asArray(dto.items, (entry) => {
      const item = asObject(entry);
      return {
        id: asNullableString(item.id) ?? asString(item.productId),
        variantId: asNullableString(item.variantId),
        packLabel: asNullableString(item.packLabel),
        components: item.components === undefined ? [] : asArray(item.components,c=>{const v=asObject(c);return {productName:asString(v.productName),unitsPerPack:asInteger(v.unitsPerPack)};}),
        productId: asString(item.productId),
        productName: asString(item.productName),
        productImage: asNullableString(item.productImage),
        quantity: asInteger(item.quantity),
        unitPrice: asInteger(item.unitPricePaise),
        lineTotal: asInteger(item.lineTotalPaise),
      };
    }),
    subtotal: asInteger(dto.subtotalPaise),
    deliveryCharge: asInteger(dto.deliveryChargePaise),
    discount: asInteger(dto.discountPaise),
    grandTotal: asInteger(dto.grandTotalPaise),
    paymentMethod: asOneOf(dto.paymentMethod, PAYMENT_METHODS),
    paymentStatus: asOneOf(dto.paymentStatus, PAYMENT_STATUSES),
    orderStatus: asOneOf(dto.orderStatus, ORDER_STATUSES),
    statusHistory: asArray(dto.statusHistory, (entry) => {
      const event = asObject(entry);
      return {
        status: asOneOf(event.status, ORDER_STATUSES),
        note: asNullableString(event.note),
        createdAt: asString(event.createdAt),
      };
    }),
    createdAt: asString(dto.createdAt),
  };
}

export type PlacedOrder = {
  order: Order;
  /** How to fetch this order again. The token is only ever returned by this call. */
  tracked: TrackedOrder;
};

/**
 * Places an order. Sending the same request again (same `clientRequestId`, same contents)
 * returns the order it already created, so retrying after a lost response cannot create a
 * duplicate. The same id with different contents is rejected with IDEMPOTENCY_CONFLICT.
 * Callers must not use this directly: go through the orders context, which persists the
 * request before sending it so it can be replayed after a restart.
 */
export function createOrder(request: CreateOrderRequest, accountToken: string): Promise<PlacedOrder> {
  return apiRequest('/orders', {
    method: 'POST',
    body: request,
    headers: { Authorization: `Bearer ${accountToken}` },
    timeoutMs: ORDER_REQUEST_TIMEOUT_MS,
    parse: (data) => {
      const order = parseOrder(data);
      return {
        order,
        tracked: {
          orderNumber: order.orderNumber,
          trackingToken: asString(asObject(data).trackingToken),
          createdAt: order.createdAt,
        },
      };
    },
  });
}

/** Account responses never contain tracking tokens or device-local credentials. */
export function fetchAccountOrders(token: string, page = 1, signal?: AbortSignal) {
  return apiRequest(`/account/orders?page=${page}&limit=25`, {
    headers: { Authorization: `Bearer ${token}` }, signal,
    parse: (data) => {
      const dto = asObject(data);
      const pagination = asObject(dto.pagination);
      return {
        items: asArray(dto.items, parseOrder),
        page: asInteger(pagination.page),
        hasMore: asInteger(pagination.page) < asInteger(pagination.totalPages),
      };
    },
  });
}

export function fetchAccountOrder(token: string, orderNumber: string) {
  return apiRequest(`/account/orders/${encodeURIComponent(orderNumber)}`, {
    headers: { Authorization: `Bearer ${token}` }, parse: parseOrder,
  });
}

export function cancelAccountOrder(token: string, orderNumber: string) {
  return apiRequest(`/account/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, parse: parseOrder,
  });
}

export function fetchOrder(tracked: TrackedOrder, signal?: AbortSignal): Promise<Order> {
  return apiRequest(`/orders/${encodeURIComponent(tracked.orderNumber)}`, {
    signal,
    headers: { [TRACKING_TOKEN_HEADER]: tracked.trackingToken },
    parse: parseOrder,
  });
}

/** The server decides whether cancellation is still allowed and returns the updated order. */
export function cancelOrder(tracked: TrackedOrder): Promise<Order> {
  return apiRequest(`/orders/${encodeURIComponent(tracked.orderNumber)}/cancel`, {
    method: 'POST',
    headers: { [TRACKING_TOKEN_HEADER]: tracked.trackingToken },
    parse: parseOrder,
  });
}
