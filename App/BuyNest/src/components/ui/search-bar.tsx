import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  placeholder: string;
  onPress: () => void;
};

/**
 * The search box shown on Home. It looks like an input but is a button that opens the
 * search screen, where the typing happens, so the keyboard never covers the Home content.
 */
export function SearchBar({ placeholder, onPress }: SearchBarProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <Icon name="search" size={22} color="textSecondary" />
      <AppText color="textSecondary" numberOfLines={1} style={styles.placeholder}>
        {placeholder}
      </AppText>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
  placeholder: {
    flex: 1,
  },
});
