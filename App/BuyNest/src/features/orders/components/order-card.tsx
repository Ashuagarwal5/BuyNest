import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { OrderStatusBadge, PaymentStatusBadge } from '@/features/orders/components/status-badges';
import type { OrderDetail } from '@/features/orders/order-reducer';
import { useTheme } from '@/hooks/use-theme';
import type { TrackedOrder } from '@/types/order';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/money';

type OrderCardProps = {
  tracked: TrackedOrder;
  /** Server data for this order, once fetched. */
  detail: OrderDetail | undefined;
};

/**
 * One row of the Orders tab. The order number and date come from the device's index, so
 * the card can always be shown; everything else needs the server and has its own loading
 * and error state, so one unreachable order does not affect the others.
 */
export function OrderCard({ tracked, detail }: OrderCardProps) {
  const theme = useTheme();
  const order = detail?.order;

  return (
    <Link href={{ pathname: '/orders/[id]', params: { id: tracked.orderNumber } }} asChild>
      {/* Link's asChild overrides a function `style`, so pressed feedback lives on the inner View. */}
      <Pressable accessibilityLabel={`Order ${tracked.orderNumber}`}>
        {({ pressed }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.grow}>
                {tracked.orderNumber}
              </AppText>
              {order ? (
                <AppText variant="bodyStrong">{formatCurrency(order.grandTotal)}</AppText>
              ) : null}
            </View>

            {order ? (
              <>
                <AppText variant="caption" color="textSecondary">
                  {formatDateTime(order.createdAt)} · {countItems(order.items)}
                </AppText>
                <View style={styles.badges}>
                  <OrderStatusBadge status={order.orderStatus} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </View>
              </>
            ) : (
              <AppText variant="caption" color="textSecondary">
                {formatDateTime(tracked.createdAt)}
              </AppText>
            )}

            {detail?.error ? (
              <AppText variant="caption" color="danger">
                {order ? 'Could not refresh. ' : ''}
                {detail.error.message}
              </AppText>
            ) : !order ? (
              <View style={styles.row}>
                <ActivityIndicator size="small" color={theme.primary} />
                <AppText variant="caption" color="textSecondary">
                  Loading order details
                </AppText>
              </View>
            ) : null}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function countItems(items: { quantity: number }[]): string {
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  grow: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
