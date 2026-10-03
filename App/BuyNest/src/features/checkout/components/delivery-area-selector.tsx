import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DeliveryArea } from '@/types/delivery';
import { formatCurrency } from '@/utils/money';

type DeliveryAreaSelectorProps = {
  areas: DeliveryArea[];
  selectedAreaId: string | null;
  onSelect: (area: DeliveryArea) => void;
  error?: string;
};

function describeArea(area: DeliveryArea): string {
  const parts = [`${formatCurrency(area.deliveryCharge)} delivery`];
  if (area.freeDeliveryThreshold !== undefined) {
    parts.push(`free above ${formatCurrency(area.freeDeliveryThreshold)}`);
  }
  if (area.minimumOrder !== undefined) {
    parts.push(`min. order ${formatCurrency(area.minimumOrder)}`);
  }
  return parts.join(' · ');
}

export function DeliveryAreaSelector({
  areas,
  selectedAreaId,
  onSelect,
  error,
}: DeliveryAreaSelectorProps) {
  const theme = useTheme();

  if (areas.length === 0) {
    return (
      <AppText color="textSecondary">
        Delivery is not available in any area right now. Please check back later.
      </AppText>
    );
  }

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {areas.map((area) => {
        const isSelected = area.id === selectedAreaId;
        return (
          <Pressable
            key={area.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${area.name}, ${describeArea(area)}`}
            onPress={() => onSelect(area)}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: isSelected ? theme.primary : theme.border,
                backgroundColor: isSelected ? theme.primarySoft : theme.background,
              },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.radio, { borderColor: isSelected ? theme.primary : theme.border }]}>
              {isSelected ? (
                <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
              ) : null}
            </View>
            <View style={styles.text}>
              <AppText variant="bodyStrong">{area.name}</AppText>
              <AppText variant="caption" color="textSecondary">
                {describeArea(area)}
              </AppText>
            </View>
          </Pressable>
        );
      })}
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const RADIO_SIZE = 22;

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  option: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  pressed: {
    opacity: 0.7,
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: RADIO_SIZE / 2,
    height: RADIO_SIZE / 2,
    borderRadius: Radius.pill,
  },
  text: {
    flex: 1,
  },
});
