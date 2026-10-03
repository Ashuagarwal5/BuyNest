import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PromoBannerProps = {
  title: string;
  subtitle: string;
  icon?: IconName;
};

export function PromoBanner({ title, subtitle, icon = 'store' }: PromoBannerProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={styles.text}>
        <AppText variant="heading" color="textOnPrimary">
          {title}
        </AppText>
        <AppText variant="caption" color="textOnPrimary" style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>
      <Icon name={icon} size={72} color="textOnPrimary" style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
    gap: Spacing.two,
  },
  subtitle: {
    opacity: 0.9,
  },
  icon: {
    opacity: 0.35,
  },
});
