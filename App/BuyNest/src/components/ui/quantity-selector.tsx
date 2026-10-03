import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuantitySelectorProps = {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  canIncrement?: boolean;
  canDecrement?: boolean;
  size?: 'medium' | 'small';
};

const BUTTON_SIZE = { medium: 44, small: 36 } as const;

export function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  canIncrement = true,
  canDecrement = true,
  size = 'medium',
}: QuantitySelectorProps) {
  const theme = useTheme();
  const buttonSize = BUTTON_SIZE[size];

  const renderButton = (icon: IconName, label: string, onPress: () => void, enabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      hitSlop={Spacing.one}
      style={({ pressed }) => [
        styles.button,
        { width: buttonSize, height: buttonSize },
        pressed && styles.pressed,
        !enabled && styles.disabled,
      ]}>
      <Icon name={icon} size={size === 'small' ? 18 : 22} color="primary" />
    </Pressable>
  );

  return (
    <View style={[styles.container, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
      {renderButton('remove', 'Decrease quantity', onDecrement, canDecrement)}
      <AppText
        variant={size === 'small' ? 'captionStrong' : 'bodyStrong'}
        style={styles.quantity}
        accessibilityLabel={`Quantity ${quantity}`}>
        {quantity}
      </AppText>
      {renderButton('add', 'Increase quantity', onIncrement, canIncrement)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.small,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: Spacing.four,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.35,
  },
});
