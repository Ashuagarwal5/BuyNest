import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Screen } from '@/components/ui/screen';
import { type ThemeColor, Radius, Spacing } from '@/constants/theme';
import { getProductById } from '@/data/products';
import { useCart } from '@/features/cart/cart-context';
import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductImage } from '@/features/catalog/components/product-image';
import { useTheme } from '@/hooks/use-theme';
import type { Product } from '@/types/catalog';

const LOW_STOCK_THRESHOLD = 5;

export function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProductById(id);

  if (!product) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Product' }} />
        <EmptyState
          icon="store"
          title="Product not found"
          message="This product is no longer available."
        />
      </Screen>
    );
  }

  return <ProductDetails product={product} />;
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

function ProductDetails({ product }: { product: Product }) {
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
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ProductImage product={product} iconSize={96} style={styles.image} />

        <View style={styles.section}>
          <AppText variant="heading">{product.name}</AppText>
          {product.rating !== null ? (
            <View style={styles.rating}>
              <Icon name="star" size={16} color="accent" />
              <AppText variant="captionStrong" color="textSecondary">
                {product.rating.toFixed(1)}
              </AppText>
            </View>
          ) : null}
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
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
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
