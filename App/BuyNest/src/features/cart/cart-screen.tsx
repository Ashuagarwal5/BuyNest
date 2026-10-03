import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { CartItem } from '@/features/cart/components/cart-item';
import { CartSummary } from '@/features/cart/components/cart-summary';

export function CartScreen() {
  const router = useRouter();
  const { lines, itemCount, subtotal, clear } = useCart();

  if (lines.length === 0) {
    return (
      <Screen edges={['left', 'right']}>
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          message="Add stationery, toys, gifts and more to get started."
          actionLabel="Start shopping"
          onAction={() => router.navigate('/')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={lines}
        keyExtractor={(line) => line.product.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="caption" color="textSecondary">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={clear}
              hitSlop={Spacing.three}
              style={({ pressed }) => pressed && styles.pressed}>
              <AppText variant="captionStrong" color="danger">
                Clear cart
              </AppText>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <CartItem line={item} />}
      />
      <CartSummary subtotal={subtotal} onCheckout={() => router.push('/checkout')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
