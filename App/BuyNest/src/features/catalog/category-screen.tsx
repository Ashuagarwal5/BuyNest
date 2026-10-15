import { useLocalSearchParams } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import { useApiData } from '@/hooks/use-api-data';
import { fetchCategories } from '@/services/api/catalog-api';

const SCREEN_EDGES = ['left', 'right'] as const;

export function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const result = useApiData(`category:${slug}`, (signal) => fetchCategories(signal));
  const category = result.status === 'success'
    ? result.data.find((item) => item.slug === slug)
    : undefined;

  return (
    <Screen edges={SCREEN_EDGES}>
      <Tabs.Screen options={{ title: category?.name ?? 'Category' }} />
      {result.status === 'loading' ? (
        <LoadingState />
      ) : result.status === 'error' ? (
        <ErrorState error={result.error} onRetry={result.reload} />
      ) : !category ? (
        <EmptyState icon="categories" title="Category not found" message="This category is not available." />
      ) : (
        <ProductGrid
          key={slug}
          listKey={`category-products:${slug}`}
          filter={{ categorySlug: slug }}
          emptyTitle="No products yet"
          emptyMessage={`We are adding ${category.name} products soon.`}
        />
      )}
    </Screen>
  );
}
