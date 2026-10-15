import { formatCurrency } from '@/utils/money';
import { cartProductKey, selectProductPack } from '@/features/cart/product-pack';
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
import { ProductReviews } from '@/features/reviews/product-reviews';
import { WishlistButton } from '@/features/wishlist/components/wishlist-button';
import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductGallery } from '@/features/catalog/components/product-gallery';
import { PackOption } from '@/features/catalog/components/pack-option';
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
        key={product.data.id}
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
  const { getQuantity, getAvailableQuantity, addItem } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [variantId, setVariantId] = useState<string | undefined>();
  const selectedProduct = selectProductPack(product, variantId);
  const quantityInCart = getQuantity(cartProductKey(selectedProduct));
  const remainingStock = getAvailableQuantity(selectedProduct);
  const canAdd = remainingStock > 0;
  // Stock can shrink while this screen is open (items added elsewhere), so clamp on read.
  const quantity = Math.max(1, Math.min(selectedQuantity, remainingStock));
  const stockStatus = getStockStatus(selectedProduct.stockQuantity);
  const quantityLabel = variantId || product.kind === 'COMBO'
    ? quantity === 1 ? 'pack' : 'packs'
    : quantity === 1 ? 'item' : 'items';

  const addSelectedToCart = () => {
    addItem(selectedProduct, quantity);
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
      <Stack.Screen options={{ title: 'Product details' }} />
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
        <ProductGallery product={product} />

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="captionStrong" color="primary">
            {product.categoryName}
          </AppText>
          <View style={styles.titleRow}>
            <AppText variant="heading" style={styles.title}>
              {product.name}
            </AppText>
            <WishlistButton productId={product.id} productName={product.name} />
          </View>
          <PriceDisplay sellingPrice={selectedProduct.sellingPrice} mrp={selectedProduct.mrp} size="large" />
          <AppText variant="captionStrong" color={stockStatus.color}>
            {stockStatus.label}
          </AppText>
        </View>

        {Boolean(product.variants?.length) && <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="bodyStrong">Choose your pack</AppText>
          <AppText variant="caption" color="textSecondary">Compare prices. Quantity below counts packs.</AppText>
          <PackOption label="Single unit" units={1} price={product.sellingPrice} mrp={product.mrp}
            selected={!variantId} available={getAvailableQuantity(product) > 0}
            onPress={() => { setVariantId(undefined); setSelectedQuantity(1); }} />
          {product.variants?.map(pack => <PackOption key={pack.id} label={pack.label} units={pack.unitsPerPack}
            price={pack.sellingPrice} mrp={pack.mrp} selected={variantId === pack.id}
            available={getAvailableQuantity(selectProductPack(product, pack.id)) > 0}
            onPress={() => { setVariantId(pack.id); setSelectedQuantity(1); }} />)}
        </View>}
        {product.kind === 'COMBO' && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="bodyStrong">Included in each combo</AppText>
            {product.comboComponents?.map(component => (
              <View key={component.productId} style={styles.subtotal}>
                <AppText style={styles.action}>{component.productName}</AppText>
                <AppText variant="bodyStrong">× {component.quantity}</AppText>
              </View>
            ))}
          </View>
        )}
        {selectedProduct.stockQuantity > 0 ? (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="bodyStrong">Quantity</AppText>
            <AppText variant="caption" color="textSecondary">
              {variantId ? selectedProduct.packLabel : product.kind === 'COMBO' ? 'Combo packs' : 'Individual units'}
            </AppText>
            <QuantitySelector
              quantity={quantity}
              onIncrement={() => setSelectedQuantity(quantity + 1)}
              onDecrement={() => setSelectedQuantity(quantity - 1)}
              canIncrement={quantity < remainingStock}
              canDecrement={quantity > 1}
            />
            {quantityInCart > 0 ? (
              <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
                {canAdd
                  ? `${quantityInCart} already in your cart`
                  : `All ${quantityInCart} available are in your cart`}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="bodyStrong">About this product</AppText>
          <AppText color="textSecondary">{product.description}</AppText>
        </View>
        <ProductReviews productId={product.id} />
      </ScrollView>

      <View style={[styles.purchaseBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.subtotal}>
          <AppText variant="caption" color="textSecondary" style={styles.action}>
            {canAdd ? `${quantity} ${quantityLabel} · Subtotal` : quantityInCart > 0 ? `${quantityInCart} in your cart` : 'Currently unavailable'}
          </AppText>
          {canAdd || quantityInCart > 0 ? <AppText variant="bodyStrong">{formatCurrency(selectedProduct.sellingPrice * (canAdd ? quantity : quantityInCart))}</AppText> : null}
        </View>
        <View style={styles.actions}>
        <View style={styles.action}>
          <PrimaryButton
            title={canAdd ? 'Add to cart' : quantityInCart > 0 ? 'Already in cart' : 'Unavailable'}
            variant="secondary"
            disabled={!canAdd}
            onPress={addSelectedToCart}
          />
        </View>
        <View style={styles.action}>
          <PrimaryButton
            title={!canAdd && quantityInCart > 0 ? 'View cart' : 'Buy now'}
            disabled={!canAdd && quantityInCart === 0}
            onPress={buyNow}
          />
        </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  purchaseBar: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  subtotal: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    flex: 1,
  },
});
