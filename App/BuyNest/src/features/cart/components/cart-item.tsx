import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { type CartLine, useCart } from '@/features/cart/cart-context';
import { ProductImage } from '@/features/catalog/components/product-image';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/money';

type CartItemProps = {
  line: CartLine;
};

export function CartItem({ line }: CartItemProps) {
  const theme = useTheme();
  const { increment, decrement, removeItem } = useCart();
  const { product, quantity, lineTotal } = line;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ProductImage product={product} iconSize={32} style={styles.image} />

      <View style={styles.details}>
        <AppText variant="captionStrong" numberOfLines={2}>
          {product.name}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {formatCurrency(product.sellingPrice)} each
        </AppText>
        <QuantitySelector
          size="small"
          quantity={quantity}
          onIncrement={() => increment(product)}
          onDecrement={() => decrement(product)}
          canIncrement={quantity < product.stockQuantity}
        />
      </View>

      <View style={styles.trailing}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${product.name} from cart`}
          onPress={() => removeItem(product.id)}
          hitSlop={Spacing.three}
          style={({ pressed }) => pressed && styles.pressed}>
          <Icon name="delete" size={22} color="textSecondary" />
        </Pressable>
        <AppText variant="bodyStrong">{formatCurrency(lineTotal)}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.card,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: Radius.medium,
  },
  details: {
    flex: 1,
    gap: Spacing.one,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.6,
  },
});
