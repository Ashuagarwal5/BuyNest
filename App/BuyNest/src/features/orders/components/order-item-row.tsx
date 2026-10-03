import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/money';

type OrderItemRowProps = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

/** One purchased line: used for the checkout summary and for placed orders. */
export function OrderItemRow({ name, quantity, unitPrice, lineTotal }: OrderItemRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.details}>
        <AppText variant="captionStrong" numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {quantity} × {formatCurrency(unitPrice)}
        </AppText>
      </View>
      <AppText variant="bodyStrong">{formatCurrency(lineTotal)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  details: {
    flex: 1,
    gap: Spacing.half,
  },
});
