import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { ORDER_PROGRESS_STEPS, ORDER_STATUS_DISPLAY } from '@/features/orders/order-status';
import { useTheme } from '@/hooks/use-theme';
import type { OrderStatus, OrderStatusEvent } from '@/types/order';
import { formatDateTime } from '@/utils/date';

type OrderTimelineProps = {
  status: OrderStatus;
  /** The server's record of when each status was reached. */
  history: OrderStatusEvent[];
};

/**
 * Progress from Placed to Delivered, exactly as the server reports it; nothing here
 * advances an order. Cancelled and failed orders are off the normal path, so they get a
 * notice instead of the steps.
 */
export function OrderTimeline({ status, history }: OrderTimelineProps) {
  const theme = useTheme();
  const currentIndex = ORDER_PROGRESS_STEPS.indexOf(status);
  const reachedAt = (step: OrderStatus) => history.find((event) => event.status === step)?.createdAt;

  if (currentIndex === -1) {
    const endedAt = reachedAt(status);
    return (
      <View style={styles.notice}>
        <AppText color="danger">
          {status === 'CANCELLED'
            ? 'This order was cancelled.'
            : 'Delivery could not be completed for this order.'}
        </AppText>
        {endedAt ? (
          <AppText variant="caption" color="textSecondary">
            {formatDateTime(endedAt)}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      {ORDER_PROGRESS_STEPS.map((step, index) => {
        const isReached = index <= currentIndex;
        const isLast = index === ORDER_PROGRESS_STEPS.length - 1;
        const timestamp = isReached ? reachedAt(step) : undefined;
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
            <View style={styles.label}>
              <AppText
                variant={index === currentIndex ? 'bodyStrong' : 'body'}
                color={isReached ? 'text' : 'textSecondary'}>
                {ORDER_STATUS_DISPLAY[step].label}
              </AppText>
              {timestamp ? (
                <AppText variant="caption" color="textSecondary">
                  {formatDateTime(timestamp)}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 14;

const styles = StyleSheet.create({
  notice: {
    gap: Spacing.one,
  },
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
