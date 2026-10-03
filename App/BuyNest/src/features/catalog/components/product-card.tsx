import { Link } from 'expo-router';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { PriceDisplay } from '@/features/catalog/components/price-display';
import { ProductImage } from '@/features/catalog/components/product-image';
import { useTheme } from '@/hooks/use-theme';
import type { Product } from '@/types/catalog';

type ProductCardProps = {
  product: Product;
  style?: StyleProp<ViewStyle>;
};

export function ProductCard({ product, style }: ProductCardProps) {
  const theme = useTheme();
  const { getQuantity, addItem, increment, decrement } = useCart();
  const quantityInCart = getQuantity(product.id);
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      {/* The cart controls sit outside the link so tapping them never opens the product. */}
      <Link href={{ pathname: '/product/[id]', params: { id: product.id } }} asChild>
        <Pressable accessibilityLabel={product.name} style={styles.details}>
          <ProductImage product={product} style={styles.image} />
          <AppText variant="captionStrong" numberOfLines={2} style={styles.name}>
            {product.name}
          </AppText>
          <PriceDisplay sellingPrice={product.sellingPrice} mrp={product.mrp} />
        </Pressable>
      </Link>

      <View style={styles.footer}>
        {isOutOfStock ? (
          <AppText variant="captionStrong" color="danger">
            Out of stock
          </AppText>
        ) : quantityInCart > 0 ? (
          <QuantitySelector
            size="small"
            quantity={quantityInCart}
            onIncrement={() => increment(product)}
            onDecrement={() => decrement(product)}
            canIncrement={quantityInCart < product.stockQuantity}
          />
        ) : (
          <PrimaryButton
            title="Add"
            size="small"
            variant="secondary"
            accessibilityLabel={`Add ${product.name} to cart`}
            onPress={() => addItem(product)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    gap: Spacing.two,
    ...Shadows.card,
  },
  details: {
    gap: Spacing.one,
  },
  image: {
    aspectRatio: 4 / 3,
    borderRadius: Radius.medium,
    marginBottom: Spacing.one,
  },
  name: {
    // Reserve two lines so cards in a row keep the same height.
    minHeight: 36,
  },
  footer: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
