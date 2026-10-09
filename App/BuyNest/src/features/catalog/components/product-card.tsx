import { Link } from 'expo-router';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { MinTouchTarget, Radius, Shadows, Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { ProductImage } from '@/features/catalog/components/product-image';
import { WishlistButton } from '@/features/wishlist/components/wishlist-button';
import { useTheme } from '@/hooks/use-theme';
import type { Product } from '@/types/catalog';
import { formatCurrency, getDiscountPercent } from '@/utils/money';

type ProductCardProps = {
  product: Product;
  style?: StyleProp<ViewStyle>;
};

/** "Only 4 left" shows at or below this many units. */
const LOW_STOCK_AT = 5;

/**
 * A product in a list or row: a large picture with the discount and "New" tags and the wishlist
 * heart on it, then the category, name, price, and one clear way to add it to the cart.
 */
export function ProductCard({ product, style }: ProductCardProps) {
  const theme = useTheme();
  const { getQuantity, addItem, increment, decrement } = useCart();
  const quantityInCart = getQuantity(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const discount = getDiscountPercent(product.mrp, product.sellingPrice);
  const isLowStock = !isOutOfStock && product.stockQuantity <= LOW_STOCK_AT;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      <Link href={{ pathname: '/product/[id]', params: { id: product.id } }} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${product.name}, ${formatCurrency(product.sellingPrice)}${isOutOfStock ? ', out of stock' : ''}`}
          style={({ pressed }) => pressed && styles.pressed}>
          <View>
            <ProductImage product={product} style={styles.image} />
            {isOutOfStock ? (
              <View style={[styles.dim, { backgroundColor: theme.surface }]} />
            ) : null}

            <View style={styles.tags} pointerEvents="none">
              {discount > 0 ? (
                <View style={[styles.tag, { backgroundColor: theme.accent }]}>
                  <AppText variant="captionStrong" color="textOnPrimary" style={styles.tagText}>
                    {discount}% OFF
                  </AppText>
                </View>
              ) : null}
              {product.isNew ? (
                <View style={[styles.tag, { backgroundColor: theme.primary }]}>
                  <AppText variant="captionStrong" color="textOnPrimary" style={styles.tagText}>
                    NEW
                  </AppText>
                </View>
              ) : null}
            </View>

            {isOutOfStock ? (
              <View style={styles.soldOut} pointerEvents="none">
                <View style={[styles.soldOutPill, { backgroundColor: theme.text }]}>
                  <AppText variant="captionStrong" color="background">
                    Out of stock
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {product.categoryName}
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={2} style={styles.name}>
              {product.name}
            </AppText>

            <View style={styles.priceRow}>
              <AppText variant="heading" style={styles.price}>
                {formatCurrency(product.sellingPrice)}
              </AppText>
              {discount > 0 ? (
                <AppText
                  variant="caption"
                  color="textSecondary"
                  accessibilityLabel={`MRP ${formatCurrency(product.mrp)}`}
                  style={styles.mrp}>
                  {formatCurrency(product.mrp)}
                </AppText>
              ) : null}
            </View>

            {/* Always one line tall, so cards in a row stay the same height. */}
            <AppText
              variant="caption"
              color={isLowStock ? 'accent' : 'textSecondary'}
              numberOfLines={1}
              style={styles.stock}>
              {isLowStock ? `Only ${product.stockQuantity} left` : isOutOfStock ? ' ' : 'In stock'}
            </AppText>
          </View>
        </Pressable>
      </Link>

      {/* The heart and the cart controls sit outside the link, so tapping them never opens the product. */}
      <WishlistButton productId={product.id} productName={product.name} style={styles.heart} />

      <View style={styles.footer}>
        {isOutOfStock ? (
          <View
            style={[
              styles.addButton,
              styles.addButtonDisabled,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}>
            <AppText variant="captionStrong" color="textSecondary">
              Unavailable
            </AppText>
          </View>
        ) : quantityInCart > 0 ? (
          <QuantitySelector
            size="small"
            quantity={quantityInCart}
            onIncrement={() => increment(product)}
            onDecrement={() => decrement(product)}
            canIncrement={quantityInCart < product.stockQuantity}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            onPress={() => addItem(product)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.primary, borderColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <Icon name="add" size={18} color="textOnPrimary" />
            <AppText variant="captionStrong" color="textOnPrimary">
              Add to cart
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  // Fades a sold-out picture so the card reads as unavailable at a glance.
  dim: {
    ...StyleSheet.absoluteFill,
    opacity: 0.55,
  },
  tags: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  // Over the top-right corner of the picture, above the link.
  heart: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    zIndex: 1,
  },
  soldOut: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  body: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  name: {
    // Two lines reserved so a one-line name does not make its card shorter than its neighbour.
    minHeight: 44,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: Spacing.two,
    marginTop: Spacing.one,
  },
  price: {
    fontWeight: '700',
  },
  mrp: {
    textDecorationLine: 'line-through',
  },
  stock: {
    minHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    minHeight: MinTouchTarget + Spacing.three,
    justifyContent: 'flex-end',
  },
  addButton: {
    minHeight: 40,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  addButtonDisabled: {
    opacity: 0.8,
  },
});
