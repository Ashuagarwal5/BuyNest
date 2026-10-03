import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getCategoryBySlug } from '@/data/categories';
import { getProductsByCategory } from '@/data/products';
import { getCategoryIcon } from '@/features/catalog/category-visuals';
import { ProductCard } from '@/features/catalog/components/product-card';

const COLUMNS = 2;

export function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const category = getCategoryBySlug(slug);

  if (!category) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Category' }} />
        <EmptyState
          icon="categories"
          title="Category not found"
          message="This category is not available."
        />
      </Screen>
    );
  }

  const products = getProductsByCategory(category.id);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: category.name }} />
      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={COLUMNS}
        contentContainerStyle={styles.content}
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
