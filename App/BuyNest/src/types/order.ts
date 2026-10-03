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

/** Address exactly as entered at checkout, kept with the order even if the customer edits it later. */
export type OrderAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  /** Name of the delivery area at the time of ordering. */
  area: string;
  city: string;
  pincode: string;
};

/** Snapshot of the product at purchase time; never read live product data for past orders. */
export type OrderItem = {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

/** All money values are integer paise. */
export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: OrderAddress;
  deliveryAreaId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  /** ISO 8601 timestamp. */
  createdAt: string;
};
