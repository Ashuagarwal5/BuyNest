import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
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
import { mayBeCancellable, PAYMENT_METHOD_DISPLAY } from '@/features/orders/order-status';
import { type TrackedOrderView, useTrackedOrder } from '@/features/orders/use-tracked-order';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/utils/date';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function OrderDetailScreen() {
  const router = useRouter();
  const { id: orderNumber } = useLocalSearchParams<{ id: string }>();
  const view = useTrackedOrder(orderNumber, true);

  if (view.status === 'ready') {
    return <OrderDetails view={view} />;
  }

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Order Details' }} />
      {view.status === 'loading' ? (
        <LoadingState />
      ) : view.status === 'error' ? (
        <ErrorState error={view.error} onRetry={view.refresh} />
      ) : (
        <EmptyState
          icon="orders"
          title="Order not found"
          message="This order was not placed from this device, so it cannot be opened here."
          actionLabel="View my orders"
          onAction={() => router.dismissTo('/orders')}
        />
      )}
    </Screen>
  );
}

function OrderDetails({ view }: { view: Extract<TrackedOrderView, { status: 'ready' }> }) {
  const theme = useTheme();
  const { cancelOrder } = useOrders();
  const { order } = view;
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    const result = await cancelOrder(order.orderNumber);
    setIsCancelling(false);
    setIsConfirmingCancel(false);
    if (!result.ok) {
      setCancelError(result.error.message);
    }
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Order Details' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={view.isRefreshing}
            onRefresh={view.refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        {view.refreshError ? (
          <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
            Could not refresh this order. {view.refreshError.message}
          </AppText>
        ) : null}

        <SectionCard title={order.orderNumber}>
          <AppText variant="caption" color="textSecondary">
            Placed on {formatDateTime(order.createdAt)}
          </AppText>
          <OrderStatusBadge status={order.orderStatus} />
        </SectionCard>

        <SectionCard title="Order Status">
          <OrderTimeline status={order.orderStatus} history={order.statusHistory} />
        </SectionCard>

        {/* Names and prices are the server's purchase-time snapshot, not today's catalogue. */}
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
          <OrderAddress recipientName={order.customerName} address={order.deliveryAddress} />
        </SectionCard>

        <SectionCard title="Customer Contact">
          <View>
            <AppText>{order.customerName}</AppText>
            <AppText color="textSecondary">+91 {order.customerPhone}</AppText>
          </View>
        </SectionCard>

        {mayBeCancellable(order.orderStatus) ? (
          <SectionCard title="Cancel Order">
            {isConfirmingCancel ? (
              <>
                <AppText color="textSecondary">Cancel this order? This cannot be undone.</AppText>
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
