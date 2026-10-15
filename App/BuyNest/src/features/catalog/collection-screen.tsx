import { useLocalSearchParams } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import type { ProductFilter } from '@/services/api/catalog-api';

/** The lists behind the "View all" buttons on the home screen. */
const COLLECTIONS: Record<string, { title: string; filter: ProductFilter; empty: string }> = {
  popular: { title: 'Popular Products', filter: { featured: true }, empty: 'Popular products will appear here.' },
  new: { title: 'New Arrivals', filter: { isNew: true }, empty: 'New arrivals will appear here.' },
};

const SCREEN_EDGES = ['left', 'right'] as const;

export function CollectionScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const collection = COLLECTIONS[kind];

  if (!collection) {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Tabs.Screen options={{ title: 'Products' }} />
        <EmptyState icon="store" title="List not found" message="This list is not available." />
      </Screen>
    );
  }

  return (
    <Screen edges={SCREEN_EDGES}>
      <Tabs.Screen options={{ title: collection.title }} />
      <ProductGrid
        listKey={`collection:${kind}`}
        filter={collection.filter}
        emptyTitle="Nothing here yet"
        emptyMessage={collection.empty}
      />
    </Screen>
  );
}
