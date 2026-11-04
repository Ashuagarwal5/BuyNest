import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useThemePreference } from '@/features/theme/theme-context';
import type { ThemePreference } from '@/features/theme/theme-storage';
import { useTheme } from '@/hooks/use-theme';

type ThemeOption = {
  value: ThemePreference;
  icon: IconName;
  title: string;
  detail: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', icon: 'lightMode', title: 'Light', detail: 'Always use the light theme' },
  { value: 'dark', icon: 'darkMode', title: 'Dark', detail: 'Always use the dark theme' },
  { value: 'system', icon: 'systemMode', title: 'System default', detail: "Match your phone's setting" },
];

export function AppearanceScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="captionStrong" color="textSecondary" style={styles.groupTitle}>
          Theme
        </AppText>
        <View
          accessibilityRole="radiogroup"
          style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = option.value === preference;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                aria-checked={isSelected}
                accessibilityLabel={`${option.title}. ${option.detail}`}
                onPress={() => setPreference(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <Icon name={option.icon} size={24} color="primary" />
                <View style={styles.optionTitle}>
                  <AppText variant="bodyStrong">{option.title}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {option.detail}
                  </AppText>
                </View>
                {isSelected ? <Icon name="check" size={22} color="primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  groupTitle: { paddingHorizontal: Spacing.one },
  list: {
    overflow: 'hidden',
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    minHeight: 56,
  },
  optionTitle: {
    flex: 1,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
