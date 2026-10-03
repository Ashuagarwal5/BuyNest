import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { OrderStatusBadge, PaymentStatusBadge } from '@/features/orders/components/status-badges';
import { useTheme } from '@/hooks/use-theme';
import type { Order } from '@/types/order';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/money';

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  const theme = useTheme();
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <Link href={{ pathname: '/orders/[id]', params: { id: order.id } }} asChild>
      {/* Link's asChild overrides a function `style`, so pressed feedback lives on the inner View. */}
      <Pressable accessibilityLabel={`Order ${order.orderNumber}`}>
        {({ pressed }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.grow}>
                {order.orderNumber}
              </AppText>
              <AppText variant="bodyStrong">{formatCurrency(order.grandTotal)}</AppText>
            </View>
            <AppText variant="caption" color="textSecondary">
              {formatDateTime(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </AppText>
            <View style={styles.badges}>
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
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
