import { StatusBadge } from '@/components/ui/status-badge';
import { ORDER_STATUS_DISPLAY, PAYMENT_STATUS_DISPLAY } from '@/features/orders/order-status';
import type { OrderStatus, PaymentStatus } from '@/types/order';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusBadge {...ORDER_STATUS_DISPLAY[status]} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge {...PAYMENT_STATUS_DISPLAY[status]} />;
}
