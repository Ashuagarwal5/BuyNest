import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/money';
import type { OrderTotals } from '@/utils/pricing';

type PriceSummaryProps = {
  totals: OrderTotals;
};

/** Subtotal, delivery, discount and grand total; used at checkout and on placed orders. */
export function PriceSummary({ totals }: PriceSummaryProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText color="textSecondary">Subtotal</AppText>
        <AppText>{formatCurrency(totals.subtotal)}</AppText>
      </View>
      <View style={styles.row}>
        <AppText color="textSecondary">Delivery Charge</AppText>
        <AppText color={totals.deliveryCharge === 0 ? 'success' : 'text'}>
          {totals.deliveryCharge === 0 ? 'Free' : formatCurrency(totals.deliveryCharge)}
        </AppText>
      </View>
      {totals.discount > 0 ? (
        <View style={styles.row}>
          <AppText color="textSecondary">Discount</AppText>
          <AppText color="success">-{formatCurrency(totals.discount)}</AppText>
        </View>
      ) : null}
      <View style={[styles.row, styles.totalRow, { borderColor: theme.border }]}>
        <AppText variant="bodyStrong">Grand Total</AppText>
        <AppText variant="heading">{formatCurrency(totals.grandTotal)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
});
