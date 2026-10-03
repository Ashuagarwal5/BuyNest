import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { OrderCard } from '@/features/orders/components/order-card';
import { useOrders } from '@/features/orders/order-context';
import { useTheme } from '@/hooks/use-theme';

export function OrdersScreen() {
  const theme = useTheme();
  const { orders, status, reload } = useOrders();

  if (status === 'loading') {
    return (
      <Screen edges={['left', 'right']} style={styles.centered}>
        <ActivityIndicator color={theme.primary} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="orders"
          title="Could not load your orders"
          message="Something went wrong while reading orders saved on this device."
          actionLabel="Try again"
          onAction={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <EmptyState
            icon="orders"
            title="No orders yet"
            message="Once you place an order, you'll see it here."
          />
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
