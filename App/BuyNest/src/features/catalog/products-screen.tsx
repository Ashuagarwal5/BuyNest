import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { FilterSheet } from '@/features/catalog/components/filter-sheet';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  describeSort,
  filterKey,
  type ProductFilterState,
  toProductFilter,
} from '@/features/catalog/product-filters';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchCategories } from '@/services/api/catalog-api';

/** The Products tab: everything the shop sells, with categories, sorting and filters. */
export function ProductsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const categories = useApiData('product-tab-categories', (signal) => fetchCategories(signal));
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const categoryList = categories.status === 'success' ? categories.data : [];
  const chips = [{ id: 'all', name: 'All', slug: null }, ...categoryList];
  const activeCount = countActiveFilters(filters);
  const hasAnything = activeCount > 0 || filters.sort !== DEFAULT_FILTERS.sort;

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.top}>
        <SearchBar
          placeholder="Search stationery, toys, gifts..."
          onPress={() => router.push('/search')}
        />
      </View>

      {categoryList.length > 0 ? (
        <FlatList
          horizontal
          data={chips}
          keyExtractor={(chip) => chip.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsRow}
          renderItem={({ item }) => {
            const isSelected = item.slug === filters.categorySlug;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setFilters((current) => ({ ...current, categorySlug: item.slug }))}
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

      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${describeSort(filters.sort)}. Opens sort and filter options.`}
          onPress={() => setIsSheetOpen(true)}
          style={[
            styles.toolButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <AppText variant="caption" color="textSecondary">
            Sort
          </AppText>
          <AppText variant="captionStrong" numberOfLines={1} style={styles.toolValue}>
            {describeSort(filters.sort)}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activeCount > 0 ? `Filters, ${activeCount} applied` : 'Filters'}
          onPress={() => setIsSheetOpen(true)}
          style={[
            styles.toolButton,
            styles.filterButton,
            {
              backgroundColor: activeCount > 0 ? theme.primarySoft : theme.surface,
              borderColor: activeCount > 0 ? theme.primary : theme.border,
            },
          ]}>
          <AppText variant="captionStrong" color={activeCount > 0 ? 'primary' : 'text'}>
            Filters
          </AppText>
          {activeCount > 0 ? (
            <View style={[styles.count, { backgroundColor: theme.primary }]}>
              <AppText variant="captionStrong" color="textOnPrimary" style={styles.countText}>
                {activeCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>

        {hasAnything ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all filters and sorting"
            onPress={() => setFilters(DEFAULT_FILTERS)}
            hitSlop={Spacing.two}>
            <AppText variant="captionStrong" color="primary">
              Clear
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ProductGrid
        listKey={`products-tab:${filterKey(filters)}`}
        filter={toProductFilter(filters)}
        emptyTitle={activeCount > 0 ? 'No products match' : 'No products yet'}
        emptyMessage={
          activeCount > 0
            ? 'Try removing a filter or widening the price range.'
            : 'We are adding products here soon.'
        }
        emptyActionLabel={activeCount > 0 ? 'Clear filters' : undefined}
        onEmptyAction={activeCount > 0 ? () => setFilters(DEFAULT_FILTERS) : undefined}
      />

      <FilterSheet
        visible={isSheetOpen}
        applied={filters}
        categories={categoryList}
        onApply={setFilters}
        onClose={() => setIsSheetOpen(false)}
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    flexShrink: 0,
  },
  toolButton: {
    minHeight: MinTouchTarget - 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  toolValue: {
    flexShrink: 1,
  },
  filterButton: {
    flexShrink: 0,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
