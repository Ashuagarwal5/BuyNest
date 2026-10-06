import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { ProductCard } from '@/features/catalog/components/product-card';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchProductsByIds } from '@/services/api/catalog-api';

const COLUMNS = 2;
const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function WishlistScreen() {
  const { isHydrated } = useWishlist();

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'My Wishlist' }} />
      {isHydrated ? <SavedProducts /> : <LoadingState />}
    </Screen>
  );
}

function SavedProducts() {
  const theme = useTheme();
  const router = useRouter();
  const { ids, remove, clear } = useWishlist();
  // The products are looked up once, for what was saved when this screen opened. Taking a heart
  // off then removes the card at once without another request, instead of reloading the list.
  const [openedWith] = useState(ids);
  const result = useApiData(`wishlist:${openedWith.join(',')}`, (signal) =>
    fetchProductsByIds(openedWith, signal),
  );

  if (openedWith.length === 0) {
    return (
      <EmptyState
        icon="store"
        title="Your wishlist is empty"
        message="Tap the heart on a product to save it here for later."
        actionLabel="Browse products"
        onAction={() => router.navigate('/products')}
      />
    );
  }
  if (result.status === 'loading') {
    return <LoadingState />;
  }
  if (result.status === 'error') {
    return <ErrorState error={result.error} onRetry={result.reload} />;
  }

  const byId = new Map(result.data.map((product) => [product.id, product]));
  // In the order they were saved, newest first, and only what is still saved.
  const products = openedWith.filter((id) => ids.includes(id)).flatMap((id) => byId.get(id) ?? []);
  // Saved, but the shop no longer sells it (removed or hidden).
  const unavailable = openedWith.filter((id) => ids.includes(id) && !byId.has(id));

  const confirmClear = () =>
    Alert.alert('Clear your wishlist?', 'All saved products will be removed from this list.', [
      { text: 'Keep them', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);

  return (
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
        <View style={styles.header}>
          <AppText variant="caption" color="textSecondary" style={styles.count}>
            {products.length} saved {products.length === 1 ? 'product' : 'products'}
          </AppText>
          {products.length > 0 ? (
            <PrimaryButton
              title="Clear all"
              variant="secondary"
              size="small"
              onPress={confirmClear}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="store"
          title="Your wishlist is empty"
          message="Tap the heart on a product to save it here for later."
          actionLabel="Browse products"
          onAction={() => router.navigate('/products')}
        />
      }
      ListFooterComponent={
        unavailable.length > 0 ? (
          <View style={styles.unavailable}>
            <AppText variant="caption" color="textSecondary">
              {unavailable.length} saved {unavailable.length === 1 ? 'product is' : 'products are'}{' '}
              no longer available.
            </AppText>
            <PrimaryButton
              title="Remove from wishlist"
              variant="secondary"
              size="small"
              onPress={() => unavailable.forEach(remove)}
            />
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.three,
  },
  count: {
    flex: 1,
  },
  // Fixed-fraction cells keep a lone last item at half width instead of stretching.
  cell: {
    width: `${100 / COLUMNS}%`,
    padding: Spacing.two,
  },
  unavailable: {
    gap: Spacing.two,
    padding: Spacing.three,
    alignItems: 'flex-start',
  },
});
