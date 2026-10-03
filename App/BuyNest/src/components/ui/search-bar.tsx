import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  placeholder: string;
};

/**
 * Visual search entry point. Search itself is not built yet, so this is intentionally
 * not interactive; it becomes a Pressable/TextInput when the search screen exists.
 */
export function SearchBar({ placeholder }: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel={placeholder}
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Icon name="search" size={22} color="textSecondary" />
      <AppText color="textSecondary" numberOfLines={1} style={styles.placeholder}>
        {placeholder}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  placeholder: {
    flex: 1,
  },
});
