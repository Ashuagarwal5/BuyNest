import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SectionCard } from '@/components/ui/section-card';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { formatAddressLines, type SavedAddress } from '@/features/addresses/address-types';
import { useTheme } from '@/hooks/use-theme';

type SavedAddressPickerProps = {
  addresses: SavedAddress[];
  /** The saved address in use, or null when the customer is typing a different one. */
  selectedId: string | null;
  onSelect: (address: SavedAddress) => void;
  onUseDifferent: () => void;
};

/** "Deliver to": pick one of the saved addresses, or choose to enter a different one. */
export function SavedAddressPicker({
  addresses,
  selectedId,
  onSelect,
  onUseDifferent,
}: SavedAddressPickerProps) {
  const theme = useTheme();
  const router = useRouter();

  const row = (
    key: string,
    isSelected: boolean,
    onPress: () => void,
    content: React.ReactNode,
    label: string,
  ) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: isSelected ? theme.primarySoft : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}>
      <View style={[styles.radio, { borderColor: isSelected ? theme.primary : theme.border }]}>
        {isSelected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
      </View>
      <View style={styles.rowText}>{content}</View>
    </Pressable>
  );

  return (
    <SectionCard title="Deliver To">
      <View accessibilityRole="radiogroup" style={styles.list}>
        {addresses.map((address) =>
          row(
            address.id,
            selectedId === address.id,
            () => onSelect(address),
            <>
              <AppText variant="bodyStrong">
                {address.label}
                {address.isDefault ? '  ·  Default' : ''}
              </AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                {address.fullName}, {formatAddressLines(address).join(', ')}
              </AppText>
            </>,
            `${address.label} address, ${formatAddressLines(address).join(', ')}`,
          ),
        )}
        {row(
          'different',
          selectedId === null,
          onUseDifferent,
          <AppText variant="bodyStrong">Use a different address</AppText>,
          'Use a different address',
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/addresses')}
        hitSlop={Spacing.two}>
        <AppText variant="captionStrong" color="primary">
          Manage saved addresses
        </AppText>
      </Pressable>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouchTarget,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
});
