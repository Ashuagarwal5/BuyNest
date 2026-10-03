import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { getCategoryIcon } from '@/features/catalog/category-visuals';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/types/catalog';

type CategoryCardProps = {
  category: Category;
  /** `tile` is the small icon-over-label version for the Home rail; `card` adds the description. */
  variant?: 'tile' | 'card';
};

export function CategoryCard({ category, variant = 'card' }: CategoryCardProps) {
  const theme = useTheme();
  const icon = getCategoryIcon(category.slug);

  return (
    <Link href={{ pathname: '/category/[slug]', params: { slug: category.slug } }} asChild>
      {/* Link's asChild overrides a function `style`, so pressed feedback lives on the inner View. */}
      <Pressable
        accessibilityLabel={category.name}
        style={variant === 'tile' ? styles.tilePressable : styles.cardPressable}>
        {({ pressed }) =>
          variant === 'tile' ? (
            <View style={[styles.tile, pressed && styles.pressed]}>
              <View style={[styles.tileIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name={icon} size={30} color="primary" />
              </View>
              <AppText variant="captionStrong" numberOfLines={2} style={styles.tileName}>
                {category.name}
              </AppText>
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name={icon} size={40} color="primary" />
              </View>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {category.name}
              </AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                {category.description}
              </AppText>
            </View>
          )
        }
      </Pressable>
    </Link>
  );
}

const TILE_WIDTH = 84;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  tilePressable: {
    width: TILE_WIDTH,
  },
  tile: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  tileIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    textAlign: 'center',
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.card,
  },
  cardIcon: {
    height: 88,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
});
