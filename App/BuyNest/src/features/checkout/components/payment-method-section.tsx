import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { PAYMENT_METHOD_DISPLAY } from '@/features/orders/order-status';
import { useTheme } from '@/hooks/use-theme';
import type { PaymentMethod } from '@/types/order';

type PaymentMethodSectionProps = {
  method: PaymentMethod;
};

/**
 * Shows the chosen payment method. Cash on Delivery is the only one, so there is nothing
 * to pick yet; when online payments arrive this becomes a list like the delivery areas.
 */
export function PaymentMethodSection({ method }: PaymentMethodSectionProps) {
  const theme = useTheme();
  const display = PAYMENT_METHOD_DISPLAY[method];

  return (
    <View style={[styles.option, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}>
      <Icon name="cash" size={28} color="primary" />
      <View style={styles.text}>
        <AppText variant="bodyStrong">{display.label}</AppText>
        <AppText variant="caption" color="textSecondary">
          {display.description}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  text: {
    flex: 1,
  },
});
