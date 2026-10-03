import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Screen } from '@/components/ui/screen';
import { type ThemeColor, Radius, Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductImage } from '@/features/catalog/components/product-image';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchProduct } from '@/services/api/catalog-api';
import type { Product } from '@/types/catalog';

const LOW_STOCK_THRESHOLD = 5;
const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useApiData(`product:${id}`, (signal) => fetchProduct(id, signal));

  if (product.status === 'success') {
    return (
      <ProductDetails
        product={product.data}
        isRefreshing={product.isRefreshing}
        onRefresh={product.reload}
      />
    );
  }

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Product' }} />
      {product.status === 'loading' ? (
        <LoadingState />
      ) : product.error.code === 'PRODUCT_NOT_FOUND' ? (
        // A definite answer from the server, so there is nothing to retry.
        <EmptyState
          icon="store"
          title="Product not found"
          message="This product is no longer available."
        />
      ) : (
        <ErrorState error={product.error} onRetry={product.reload} />
      )}
    </Screen>
  );
}

function getStockStatus(stock: number): { label: string; color: ThemeColor } {
  if (stock <= 0) {
    return { label: 'Out of stock', color: 'danger' };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: `Only ${stock} left`, color: 'accent' };
  }
  return { label: 'In stock', color: 'success' };
}

type ProductDetailsProps = {
  product: Product;
  isRefreshing: boolean;
  onRefresh: () => void;
};

function ProductDetails({ product, isRefreshing, onRefresh }: ProductDetailsProps) {
  const theme = useTheme();
  const router = useRouter();
  const { getQuantity, addItem } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const quantityInCart = getQuantity(product.id);
  const remainingStock = product.stockQuantity - quantityInCart;
  const canAdd = remainingStock > 0;
  // Stock can shrink while this screen is open (items added elsewhere), so clamp on read.
  const quantity = Math.max(1, Math.min(selectedQuantity, remainingStock));
  const stockStatus = getStockStatus(product.stockQuantity);

  const addSelectedToCart = () => {
    addItem(product, quantity);
    setSelectedQuantity(1);
  };

  const buyNow = () => {
    if (canAdd) {
      addSelectedToCart();
    }
    router.navigate('/cart');
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        <ProductImage product={product} iconSize={96} style={styles.image} />

        <View style={styles.section}>
          <AppText variant="captionStrong" color="primary">
            {product.categoryName}
          </AppText>
          <AppText variant="heading">{product.name}</AppText>
          <PriceDisplay sellingPrice={product.sellingPrice} mrp={product.mrp} size="large" />
          <AppText variant="captionStrong" color={stockStatus.color}>
            {stockStatus.label}
          </AppText>
        </View>

        {product.stockQuantity > 0 ? (
          <View style={styles.section}>
            <AppText variant="bodyStrong">Quantity</AppText>
            <QuantitySelector
              quantity={quantity}
              onIncrement={() => setSelectedQuantity(quantity + 1)}
              onDecrement={() => setSelectedQuantity(quantity - 1)}
              canIncrement={quantity < remainingStock}
              canDecrement={quantity > 1}
            />
            {quantityInCart > 0 ? (
              <AppText variant="caption" color="textSecondary">
                {canAdd
                  ? `${quantityInCart} already in your cart`
                  : `All ${quantityInCart} available are in your cart`}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText variant="bodyStrong">Description</AppText>
          <AppText color="textSecondary">{product.description}</AppText>
        </View>
      </ScrollView>

      <View style={[styles.actions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.action}>
          <PrimaryButton
            title="Add to Cart"
            variant="secondary"
            disabled={!canAdd}
            onPress={addSelectedToCart}
          />
        </View>
        <View style={styles.action}>
          <PrimaryButton
            title="Buy Now"
            disabled={!canAdd && quantityInCart === 0}
            onPress={buyNow}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  image: {
    aspectRatio: 4 / 3,
    maxHeight: 320,
    alignSelf: 'stretch',
    borderRadius: Radius.large,
  },
  section: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: {
    flex: 1,
  },
});
