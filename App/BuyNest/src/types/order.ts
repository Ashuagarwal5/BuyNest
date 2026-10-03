export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DELIVERY_FAILED';

export type PaymentStatus = 'PENDING' | 'COLLECTED' | 'REFUNDED';

/** Only Cash on Delivery exists today; online methods get added to this union later. */
export type PaymentMethod = 'COD';

export type OrderAddress = {
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  /** Name of the delivery area at the time of ordering. */
  area: string;
  city: string;
  pincode: string;
};

/** Snapshot of the product at purchase time, as recorded by the server. */
export type OrderItem = {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderStatusEvent = {
  status: OrderStatus;
  note: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
};

/**
 * An order as the server reports it. The app never builds or edits one of these itself;
 * it only remembers how to fetch it (see TrackedOrder). All money values are integer paise.
 */
export type Order = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusEvent[];
  /** ISO 8601 timestamp. */
  createdAt: string;
};

/**
 * What the device keeps for each order it placed: enough to ask the server for it.
 * The tracking token is a secret. It is never shown, logged or put in a URL.
 */
export type TrackedOrder = {
  orderNumber: string;
  trackingToken: string;
  /** ISO 8601 timestamp, used to list newest first before details have loaded. */
  createdAt: string;
};
