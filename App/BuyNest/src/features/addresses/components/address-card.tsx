import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { formatAddressLines, type SavedAddress } from '@/features/addresses/address-types';
import { useTheme } from '@/hooks/use-theme';

type AddressCardProps = {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
};

/** One saved address with the things you can do to it. */
export function AddressCard({ address, onEdit, onDelete, onMakeDefault }: AddressCardProps) {
  const theme = useTheme();

  const action = (label: string, onPress: () => void, color: 'primary' | 'danger') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${address.label} address`}
      onPress={onPress}
      hitSlop={Spacing.two}
      style={({ pressed }) => pressed && styles.pressed}>
      <AppText variant="captionStrong" color={color}>
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: address.isDefault ? theme.primary : theme.border,
        },
      ]}>
      <View style={styles.header}>
        <View style={[styles.label, { backgroundColor: theme.primarySoft }]}>
          <AppText variant="captionStrong" color="primary">
            {address.label}
          </AppText>
        </View>
        {address.isDefault ? (
          <AppText variant="captionStrong" color="success">
            Default
          </AppText>
        ) : null}
      </View>

      <View style={styles.lines}>
        <AppText variant="bodyStrong">{address.fullName}</AppText>
        {formatAddressLines(address).map((line) => (
          <AppText key={line} color="textSecondary">
            {line}
          </AppText>
        ))}
        <AppText color="textSecondary">Mobile: {address.phone}</AppText>
      </View>

      <View style={styles.actions}>
        {action('Edit', onEdit, 'primary')}
        {address.isDefault ? null : action('Make default', onMakeDefault, 'primary')}
        {action('Delete', onDelete, 'danger')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  lines: {
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.four,
    flexWrap: 'wrap',
  },
  pressed: {
    opacity: 0.6,
  },
});
