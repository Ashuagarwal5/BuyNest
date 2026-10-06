import { Alert, Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MinTouchTarget, Radius } from '@/constants/theme';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { MAX_WISHLIST_ITEMS } from '@/features/wishlist/wishlist-storage';
import { useTheme } from '@/hooks/use-theme';

type WishlistButtonProps = {
  productId: string;
  productName: string;
  /** Position it where it is used, for example in a corner of a product picture. */
  style?: StyleProp<ViewStyle>;
};

/** A heart that saves a product to the wishlist, or takes it out again. */
export function WishlistButton({ productId, productName, style }: WishlistButtonProps) {
  const theme = useTheme();
  const { has, toggle } = useWishlist();
  const isSaved = has(productId);

  const onPress = () => {
    if (toggle(productId) === 'full') {
      Alert.alert(
        'Your wishlist is full',
        `You can save up to ${MAX_WISHLIST_ITEMS} products. Remove one to save another.`,
      );
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isSaved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`
      }
      accessibilityState={{ selected: isSaved }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
        style,
      ]}>
      <AppText style={[styles.heart, { color: isSaved ? theme.danger : theme.textSecondary }]}>
        {isSaved ? '♥' : '♡'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MinTouchTarget - 8,
    height: MinTouchTarget - 8,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  heart: {
    fontSize: 22,
    lineHeight: 26,
    // The glyph sits a little low in its box on most phones.
    marginTop: -1,
  },
});
