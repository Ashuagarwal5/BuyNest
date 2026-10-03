import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { ORDER_PROGRESS_STEPS, ORDER_STATUS_DISPLAY } from '@/features/orders/order-status';
import { useTheme } from '@/hooks/use-theme';
import type { OrderStatus } from '@/types/order';

type OrderTimelineProps = {
  status: OrderStatus;
};

/**
 * Progress from Placed to Delivered. It only reflects the order's real status; nothing
 * here advances an order. Cancelled and failed orders are off the normal path, so they
 * get a notice instead of the steps.
 */
export function OrderTimeline({ status }: OrderTimelineProps) {
  const theme = useTheme();
  const currentIndex = ORDER_PROGRESS_STEPS.indexOf(status);

  if (currentIndex === -1) {
    return (
      <AppText color="danger">
        {status === 'CANCELLED'
          ? 'This order was cancelled.'
          : 'Delivery could not be completed for this order.'}
      </AppText>
    );
  }

  return (
    <View>
      {ORDER_PROGRESS_STEPS.map((step, index) => {
        const isReached = index <= currentIndex;
        const isLast = index === ORDER_PROGRESS_STEPS.length - 1;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.marker}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isReached ? theme.primary : theme.surface,
                    borderColor: isReached ? theme.primary : theme.border,
                  },
                ]}
              />
              {isLast ? null : (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: index < currentIndex ? theme.primary : theme.border },
                  ]}
                />
              )}
            </View>
            <AppText
              variant={index === currentIndex ? 'bodyStrong' : 'body'}
              color={isReached ? 'text' : 'textSecondary'}
              style={styles.label}>
              {ORDER_STATUS_DISPLAY[step].label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 14;

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  marker: {
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: Spacing.three,
  },
  label: {
    flex: 1,
    paddingBottom: Spacing.three,
  },
});
