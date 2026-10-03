import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { Radius, Spacing } from '@/constants/theme';
import { OrderAddress } from '@/features/orders/components/order-address';
import { OrderStatusBadge } from '@/features/orders/components/status-badges';
import { PAYMENT_METHOD_DISPLAY } from '@/features/orders/order-status';
import { useTrackedOrder } from '@/features/orders/use-tracked-order';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/money';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function OrderSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id: orderNumber } = useLocalSearchParams<{ id: string }>();
  // Checkout arrives here with the order the server just returned already in memory.
  const view = useTrackedOrder(orderNumber, false);

  const goHome = () => router.dismissTo('/');

  if (view.status !== 'ready') {
    return (
      <Screen edges={SCREEN_EDGES}>
        {view.status === 'loading' ? (
          <LoadingState />
        ) : view.status === 'error' ? (
          <ErrorState error={view.error} onRetry={view.refresh} />
        ) : (
          <EmptyState
            icon="orders"
            title="Order not found"
            message="This order was not placed from this device, so it cannot be opened here."
            actionLabel="Continue Shopping"
            onAction={goHome}
          />
        )}
      </Screen>
    );
  }

  const { order } = view;

  return (
    <Screen edges={SCREEN_EDGES}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="success" size={48} color="primary" />
          </View>
          <AppText variant="title" style={styles.centerText}>
            Order Placed Successfully
          </AppText>
          <AppText color="textSecondary" style={styles.centerText}>
            Thank you, {order.customerName}. We will confirm your order shortly.
          </AppText>
        </View>

        <SectionCard title="Order Summary">
          <View style={styles.row}>
            <AppText color="textSecondary">Order Number</AppText>
            <AppText variant="bodyStrong">{order.orderNumber}</AppText>
          </View>
          <View style={styles.row}>
            <AppText color="textSecondary">Amount</AppText>
            <AppText variant="bodyStrong">{formatCurrency(order.grandTotal)}</AppText>
          </View>
          <View style={styles.row}>
            <AppText color="textSecondary">Payment</AppText>
            <AppText>{PAYMENT_METHOD_DISPLAY[order.paymentMethod].label}</AppText>
          </View>
          <View style={styles.row}>
            <AppText color="textSecondary">Status</AppText>
            <OrderStatusBadge status={order.orderStatus} />
          </View>
        </SectionCard>

        <SectionCard title="Delivering To">
          <OrderAddress recipientName={order.customerName} address={order.deliveryAddress} />
        </SectionCard>

        <View style={styles.actions}>
          {/* replace: Back from the order should not land on this confirmation again. */}
          <PrimaryButton
            title="View Order"
            onPress={() =>
              router.replace({ pathname: '/orders/[id]', params: { id: order.orderNumber } })
            }
          />
          <PrimaryButton title="Continue Shopping" variant="secondary" onPress={goHome} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.three,
  },
});
