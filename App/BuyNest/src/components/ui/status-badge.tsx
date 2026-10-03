import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { type ThemeColor, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusBadgeProps = {
  label: string;
  color: ThemeColor;
};

export function StatusBadge({ label, color }: StatusBadgeProps) {
  const theme = useTheme();

  return (
    <View style={[styles.badge, { borderColor: theme[color], backgroundColor: theme.surface }]}>
      <AppText variant="captionStrong" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
