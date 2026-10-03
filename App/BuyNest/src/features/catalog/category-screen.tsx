import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getCategoryIcon } from '@/features/catalog/category-visuals';
import { ProductCard } from '@/features/catalog/components/product-card';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchCategories, fetchProducts } from '@/services/api/catalog-api';

const COLUMNS = 2;
const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function CategoryScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const result = useApiData(`category:${slug}`, async (signal) => {
    const [categories, products] = await Promise.all([
      fetchCategories(signal),
      fetchProducts({ categorySlug: slug }, signal),
    ]);
    // The API has no single-category endpoint; an unknown slug is simply absent here.
    return { category: categories.find((category) => category.slug === slug), products };
  });

  if (result.status !== 'success') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title: 'Category' }} />
        {result.status === 'loading' ? (
          <LoadingState />
        ) : (
          <ErrorState error={result.error} onRetry={result.reload} />
        )}
      </Screen>
    );
  }

  const { category, products } = result.data;

  if (!category) {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title: 'Category' }} />
        <EmptyState
          icon="categories"
          title="Category not found"
          message="This category is not available."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: category.name }} />
      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={COLUMNS}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={result.isRefreshing}
            onRefresh={result.reload}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          products.length > 0 ? (
            <AppText variant="caption" color="textSecondary" style={styles.count}>
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </AppText>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={getCategoryIcon(category.slug)}
            title="No products yet"
            message={`We are adding ${category.name} products soon.`}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.two,
  },
  count: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.one,
  },
  // Fixed-fraction cells keep a lone last item at half width instead of stretching.
  cell: {
    width: `${100 / COLUMNS}%`,
    padding: Spacing.two,
  },
});
