import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchCategories } from '@/services/api/catalog-api';

/** The Products tab: everything the shop sells, with a row of categories to narrow it down. */
export function ProductsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const categories = useApiData('product-tab-categories', (signal) => fetchCategories(signal));
  // The category being shown, as its slug. null means every product.
  const [slug, setSlug] = useState<string | null>(null);

  const chips = [{ id: 'all', name: 'All', slug: null }, ...(categories.data ?? []).map((category) => ({ ...category }))];

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.top}>
        <SearchBar placeholder="Search stationery, toys, gifts..." onPress={() => router.push('/search')} />
      </View>

      {categories.status === 'success' && categories.data.length > 0 ? (
        <FlatList
          horizontal
          data={chips}
          keyExtractor={(chip) => chip.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsRow}
          renderItem={({ item }) => {
            const isSelected = item.slug === slug;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSlug(item.slug)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}>
                <AppText variant="captionStrong" color={isSelected ? 'textOnPrimary' : 'text'}>
                  {item.name}
                </AppText>
              </Pressable>
            );
          }}
        />
      ) : null}

      <ProductGrid
        listKey={`products-tab:${slug ?? 'all'}`}
        filter={slug ? { categorySlug: slug } : {}}
        emptyTitle="No products yet"
        emptyMessage="We are adding products here soon."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  // Without flexShrink 0 the product list below squeezes this row down to nothing.
  chipsRow: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chips: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    minHeight: MinTouchTarget - 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
