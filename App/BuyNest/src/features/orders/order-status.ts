import type { ThemeColor } from '@/constants/theme';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/order';

type StatusDisplay = { label: string; color: ThemeColor };

export const ORDER_STATUS_DISPLAY: Record<OrderStatus, StatusDisplay> = {
  PLACED: { label: 'Order Placed', color: 'accent' },
  CONFIRMED: { label: 'Confirmed', color: 'primary' },
  PACKED: { label: 'Packed', color: 'primary' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'primary' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'danger' },
  DELIVERY_FAILED: { label: 'Delivery Failed', color: 'danger' },
};

export const PAYMENT_STATUS_DISPLAY: Record<PaymentStatus, StatusDisplay> = {
  PENDING: { label: 'Payment Pending', color: 'accent' },
  COLLECTED: { label: 'Paid', color: 'success' },
  REFUNDED: { label: 'Refunded', color: 'textSecondary' },
};

export const PAYMENT_METHOD_DISPLAY: Record<PaymentMethod, { label: string; description: string }> =
  {
    COD: { label: 'Cash on Delivery', description: 'Pay when your order arrives' },
  };

/** The normal path of an order, in sequence, for the timeline. */
export const ORDER_PROGRESS_STEPS: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
