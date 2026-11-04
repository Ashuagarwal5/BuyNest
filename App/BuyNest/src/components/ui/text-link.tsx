import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MinTouchTarget, Spacing } from '@/constants/theme';

type TextLinkProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** A tappable line of text for minor actions, with a full-size touch target. */
export function TextLink({ title, onPress, disabled = false, accessibilityLabel }: TextLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, disabled && styles.disabled]}>
      <AppText variant="bodyStrong" color="primary">
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
});
