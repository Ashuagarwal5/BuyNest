import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/money';

type CartSummaryProps = {
  subtotal: number;
  onCheckout: () => void;
};

export function CartSummary({ subtotal, onCheckout }: CartSummaryProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.row}>
        <AppText variant="bodyStrong">Subtotal</AppText>
        <AppText variant="heading">{formatCurrency(subtotal)}</AppText>
      </View>
      {/* The charge depends on the delivery area, which is only chosen at checkout. */}
      <View style={styles.row}>
        <AppText color="textSecondary">Delivery</AppText>
        <AppText variant="caption" color="textSecondary">
          Calculated at checkout
        </AppText>
      </View>
      <PrimaryButton title="Proceed to Checkout" onPress={onCheckout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
