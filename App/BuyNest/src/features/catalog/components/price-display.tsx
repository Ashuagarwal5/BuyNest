import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { formatCurrency, getDiscountPercent } from '@/utils/money';

type PriceDisplayProps = {
  sellingPrice: number;
  mrp: number;
  size?: 'small' | 'large';
};

export function PriceDisplay({ sellingPrice, mrp, size = 'small' }: PriceDisplayProps) {
  const discount = getDiscountPercent(mrp, sellingPrice);

  return (
    <View style={styles.container}>
      <AppText variant={size === 'large' ? 'title' : 'bodyStrong'}>
        {formatCurrency(sellingPrice)}
      </AppText>
      {discount > 0 ? (
        <>
          <AppText
            variant={size === 'large' ? 'body' : 'caption'}
            color="textSecondary"
            accessibilityLabel={`MRP ${formatCurrency(mrp)}`}
            style={styles.mrp}>
            {formatCurrency(mrp)}
          </AppText>
          <AppText variant={size === 'large' ? 'bodyStrong' : 'captionStrong'} color="success">
            {discount}% off
          </AppText>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: Spacing.two,
  },
  mrp: {
    textDecorationLine: 'line-through',
  },
});
