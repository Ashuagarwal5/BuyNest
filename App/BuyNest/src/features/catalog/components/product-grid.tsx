import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Spacing } from '@/constants/theme';
import { ProductCard } from '@/features/catalog/components/product-card';
import { useProductPages } from '@/features/catalog/use-product-pages';
import { useTheme } from '@/hooks/use-theme';
import { toApiError } from '@/services/api/api-error';
import type { ProductFilter } from '@/services/api/catalog-api';

const COLUMNS = 2;
/** Start loading the next page when the customer is within this many screens of the end. */
const LOAD_AHEAD = 1.5;

type ProductGridProps = {
  /** Identifies the list: change it whenever `filter` changes, so the new list starts at page one. */
  listKey: string;
  filter: ProductFilter;
  emptyTitle: string;
  emptyMessage: string;
  /** A button on the empty state, for example "Clear filters". */
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
};

/** Two-column product list with pull-to-refresh and loading as you scroll. */
export function ProductGrid({
  listKey,
  filter,
  emptyTitle,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
}: ProductGridProps) {
  const theme = useTheme();
  const list = useProductPages(listKey, filter);

  if (list.status === 'loading') {
    return <LoadingState />;
  }
  if (list.status === 'error') {
    return <ErrorState error={toApiError(list.error)} onRetry={list.reload} />;
  }

  return (
    <FlatList
      data={list.items}
      keyExtractor={(product) => product.id}
      numColumns={COLUMNS}
      contentContainerStyle={styles.content}
      onEndReached={list.loadMore}
      onEndReachedThreshold={LOAD_AHEAD}
      refreshControl={
        <RefreshControl
          refreshing={list.isRefreshing}
          onRefresh={list.reload}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="store"
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      }
      ListFooterComponent={
        list.isLoadingMore ? (
          <ActivityIndicator color={theme.primary} style={styles.footer} />
        ) : list.moreFailed ? (
          <Pressable accessibilityRole="button" onPress={list.loadMore} style={styles.footer}>
            <AppText variant="captionStrong" color="primary" style={styles.retry}>
              Could not load more. Tap to try again.
            </AppText>
          </Pressable>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.two,
  },
  // Fixed-fraction cells keep a lone last item at half width instead of stretching.
  cell: {
    width: `${100 / COLUMNS}%`,
    padding: Spacing.two,
  },
  footer: {
    paddingVertical: Spacing.three,
  },
  retry: {
    textAlign: 'center',
  },
});
