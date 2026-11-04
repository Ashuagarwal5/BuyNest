import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
  /** A short line above the title, such as "Step 1 of 2". */
  eyebrow?: string;
  /** Shown under the subtitle when the customer came from checkout, so they know the cart is safe. */
  showCartNote?: boolean;
  children?: ReactNode;
};

/** The logo, title and one-line purpose at the top of the sign-in and registration screens. */
export function AuthHeader({ title, subtitle, eyebrow, showCartNote = false, children }: AuthHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <Image
        source={require('../../../../assets/images/icon.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
      {eyebrow ? (
        <AppText variant="captionStrong" color="primary">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title" accessibilityRole="header" style={styles.centered}>
        {title}
      </AppText>
      <AppText color="textSecondary" style={styles.centered}>
        {subtitle}
      </AppText>
      {showCartNote ? (
        <View style={[styles.note, { backgroundColor: theme.primarySoft }]}>
          <Icon name="cart" size={18} color="primary" />
          <AppText variant="captionStrong" color="primary" style={styles.noteText}>
            Your cart is saved. Sign in to continue checkout.
          </AppText>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    marginBottom: Spacing.one,
  },
  centered: { textAlign: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  noteText: { flexShrink: 1 },
});
