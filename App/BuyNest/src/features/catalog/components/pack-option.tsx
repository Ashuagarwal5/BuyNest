import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/money';

type PackOptionProps = {
  label: string;
  units: number;
  price: number;
  mrp: number;
  selected: boolean;
  available: boolean;
  onPress: () => void;
};

export function PackOption({ label, units, price, mrp, selected, available, onPress }: PackOptionProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${units} ${units === 1 ? 'unit' : 'units'}, ${formatCurrency(price)}${available ? '' : ', unavailable to add'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, {
        backgroundColor: selected ? theme.primarySoft : theme.surface,
        borderColor: selected ? theme.primary : theme.border,
      }, pressed && { opacity: 0.8 }]}>
      <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.textSecondary }]}>
        {selected && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
      </View>
      <View style={styles.details}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" color="textSecondary">
          {units} {units === 1 ? 'unit' : 'units'} · {formatCurrency(Math.round(price / units))} / unit
        </AppText>
        {!available && <AppText variant="caption" color="danger">Unavailable to add</AppText>}
      </View>
      <View style={styles.prices}>
        <AppText variant="bodyStrong" color={selected ? 'primary' : 'text'}>{formatCurrency(price)}</AppText>
        {mrp > price && <AppText variant="caption" color="textSecondary" style={styles.mrp}>{formatCurrency(mrp)}</AppText>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: MinTouchTarget, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.medium },
  details: { flex: 1, gap: Spacing.one },
  prices: { alignItems: 'flex-end', gap: Spacing.one },
  mrp: { textDecorationLine: 'line-through' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
