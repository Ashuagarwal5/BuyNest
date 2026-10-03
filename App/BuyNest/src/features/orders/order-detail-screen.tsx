import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { PriceSummary } from '@/components/ui/price-summary';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { Spacing } from '@/constants/theme';
import { OrderAddress } from '@/features/orders/components/order-address';
import { OrderItemRow } from '@/features/orders/components/order-item-row';
import { OrderTimeline } from '@/features/orders/components/order-timeline';
import { OrderStatusBadge, PaymentStatusBadge } from '@/features/orders/components/status-badges';
import { useOrders } from '@/features/orders/order-context';
import { canCancelOrder } from '@/features/orders/order-service';
import { PAYMENT_METHOD_DISPLAY } from '@/features/orders/order-status';
import { useTheme } from '@/hooks/use-theme';
import type { Order } from '@/types/order';
import { formatDateTime } from '@/utils/date';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function OrderDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrderById, status } = useOrders();
  const order = getOrderById(id);

  if (order) {
    return <OrderDetails order={order} />;
  }

  return (
    <Screen edges={SCREEN_EDGES} style={status === 'loading' ? styles.centered : undefined}>
      <Stack.Screen options={{ title: 'Order Details' }} />
      {status === 'loading' ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <EmptyState
          icon="orders"
          title="Order not found"
          message="We could not find this order on this device."
          actionLabel="View my orders"
          onAction={() => router.dismissTo('/orders')}
        />
      )}
    </Screen>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const { cancelOrder } = useOrders();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    const result = await cancelOrder(order.id);
    setIsCancelling(false);
    setIsConfirmingCancel(false);
    if (!result.ok) {
      setCancelError(result.message);
    }
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Order Details' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title={order.orderNumber}>
          <AppText variant="caption" color="textSecondary">
            Placed on {formatDateTime(order.createdAt)}
          </AppText>
          <OrderStatusBadge status={order.orderStatus} />
        </SectionCard>

        <SectionCard title="Order Status">
          <OrderTimeline status={order.orderStatus} />
        </SectionCard>

        <SectionCard title="Items">
          {order.items.map((item) => (
            <OrderItemRow
              key={item.productId}
              name={item.productName}
              quantity={item.quantity}
              unitPrice={item.unitPrice}
              lineTotal={item.lineTotal}
            />
          ))}
        </SectionCard>

        <SectionCard title="Price Details">
          <PriceSummary totals={order} />
        </SectionCard>

        <SectionCard title="Payment">
          <AppText>{PAYMENT_METHOD_DISPLAY[order.paymentMethod].label}</AppText>
          <PaymentStatusBadge status={order.paymentStatus} />
        </SectionCard>

        <SectionCard title="Delivery Address">
          <OrderAddress address={order.deliveryAddress} />
        </SectionCard>

        <SectionCard title="Customer Contact">
          <View>
            <AppText>{order.customerName}</AppText>
            <AppText color="textSecondary">+91 {order.customerPhone}</AppText>
          </View>
        </SectionCard>

        {canCancelOrder(order) ? (
          <SectionCard title="Cancel Order">
            {isConfirmingCancel ? (
              <>
                <AppText color="textSecondary">
                  Cancel this order? This cannot be undone.
                </AppText>
                <View style={styles.cancelActions}>
                  <View style={styles.grow}>
                    <PrimaryButton
                      title="Keep Order"
                      variant="secondary"
                      disabled={isCancelling}
                      onPress={() => setIsConfirmingCancel(false)}
                    />
                  </View>
                  <View style={styles.grow}>
                    <PrimaryButton
                      title="Yes, Cancel"
                      variant="danger"
                      loading={isCancelling}
                      onPress={handleCancel}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <AppText variant="caption" color="textSecondary">
                  You can cancel until the shop confirms your order.
                </AppText>
                <PrimaryButton
                  title="Cancel Order"
                  variant="danger"
                  onPress={() => setIsConfirmingCancel(true)}
                />
              </>
            )}
          </SectionCard>
        ) : null}

        {cancelError ? (
          <AppText color="danger" accessibilityLiveRegion="polite">
            {cancelError}
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cancelActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  grow: {
    flex: 1,
  },
});
