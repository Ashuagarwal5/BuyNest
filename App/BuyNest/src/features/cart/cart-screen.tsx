import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { CartItem } from '@/features/cart/components/cart-item';
import { CartSummary } from '@/features/cart/components/cart-summary';
import { UnconfirmedOrderNotice } from '@/features/orders/components/unconfirmed-order-notice';

export function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { lines, itemCount, subtotal, hasIssues, isHydrated, clear, refreshProducts } = useCart();

  // Prices and stock in a saved cart can be days old, so re-read them whenever the cart
  // is opened. A failed refresh keeps the last-known values; the server has the final say
  // at checkout either way.
  const refresh = useEffectEvent(() => {
    if (isHydrated) {
      refreshProducts();
    }
  });
  useEffect(() => {
    refresh();
    // The tab stays mounted, so returning to it needs the focus event as well.
    return navigation.addListener('focus', () => refresh());
  }, [navigation, isHydrated]);

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
          <View style={styles.headerBlock}>
            <UnconfirmedOrderNotice />
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
          </View>
        }
        renderItem={({ item }) => <CartItem line={item} />}
      />
      <CartSummary
        subtotal={subtotal}
        hasIssues={hasIssues}
        onCheckout={() => router.push('/checkout')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  headerBlock: {
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
