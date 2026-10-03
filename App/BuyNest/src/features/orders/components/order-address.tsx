import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import type { OrderAddress as OrderAddressType } from '@/types/order';

type OrderAddressProps = {
  address: OrderAddressType;
};

export function OrderAddress({ address }: OrderAddressProps) {
  const streetLines = [address.addressLine1, address.addressLine2].filter(Boolean);
  const locality = [address.area, address.city].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">{address.fullName}</AppText>
      {streetLines.map((line) => (
        <AppText key={line} color="textSecondary">
          {line}
        </AppText>
      ))}
      {address.landmark ? (
        <AppText color="textSecondary">Landmark: {address.landmark}</AppText>
      ) : null}
      <AppText color="textSecondary">
        {locality} - {address.pincode}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.half,
  },
});
