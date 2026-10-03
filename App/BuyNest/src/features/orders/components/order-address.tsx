import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import type { OrderAddress as OrderAddressType } from '@/types/order';

type OrderAddressProps = {
  recipientName: string;
  address: OrderAddressType;
};

export function OrderAddress({ recipientName, address }: OrderAddressProps) {
  const streetLines = [address.addressLine1, address.addressLine2].filter(
    (line): line is string => Boolean(line)
  );
  const locality = [address.area, address.city].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <AppText variant="bodyStrong">{recipientName}</AppText>
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
