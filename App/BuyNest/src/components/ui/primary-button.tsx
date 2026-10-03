import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  /** `secondary` is outlined, for the less important action in a pair; `danger` is outlined red. */
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'medium' | 'small';
  disabled?: boolean;
  /** Shows a spinner and blocks presses while work is in progress. */
  loading?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const accent = variant === 'danger' ? 'danger' : 'primary';
  const contentColor = isPrimary ? 'textOnPrimary' : accent;
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      hitSlop={size === 'small' ? Spacing.two : undefined}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.medium,
        {
          backgroundColor: isPrimary ? theme.primary : theme.surface,
          borderColor: theme[accent],
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme[contentColor]} />
      ) : (
        <AppText variant={size === 'small' ? 'captionStrong' : 'bodyStrong'} color={contentColor}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  medium: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
