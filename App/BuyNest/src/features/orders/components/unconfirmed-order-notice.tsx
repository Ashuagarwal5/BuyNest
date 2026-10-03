import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { useOrders } from '@/features/orders/order-context';
import { useTheme } from '@/hooks/use-theme';

type UnconfirmedOrderNoticeProps = {
  /** `replace` when shown on a screen that must not stay in history (checkout). */
  navigation?: 'push' | 'replace';
};

/**
 * Shown while an order submission has no confirmed answer. The order may or may not exist
 * on the server, so this never says "failed". Retry replays the ORIGINAL request, so it
 * returns the order if the server made it and creates it exactly once if it did not.
 */
export function UnconfirmedOrderNotice({ navigation = 'push' }: UnconfirmedOrderNoticeProps) {
  const theme = useTheme();
  const router = useRouter();
  const { pending, isSubmitting, retryPending } = useOrders();
  const { clearIfMatches } = useCart();
  // What the last retry found, kept after a definite refusal removes the attempt itself.
  const [outcome, setOutcome] = useState<string | null>(null);

  const handleRetry = async () => {
    setOutcome(null);
    const result = await retryPending();

    if (result.ok) {
      // Only the cart this order was made from is cleared, never a newer one.
      clearIfMatches(result.cartFingerprint);
      const target = { pathname: '/order-success/[id]', params: { id: result.order.orderNumber } } as const;
      if (navigation === 'replace') {
        router.replace(target);
      } else {
        router.push(target);
      }
      return;
    }

    if (result.kind === 'FAILED') {
      setOutcome(
        `Your earlier order was not placed. ${result.error.message} You can update your cart and order again.`
      );
    } else if (result.kind === 'UNKNOWN') {
      setOutcome(`${result.error.message} We still could not confirm your order.`);
    }
  };

  if (!pending && !outcome) {
    return null;
  }

  const itemCount = pending?.request.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
      {pending ? (
        <>
          <AppText variant="bodyStrong">We couldn&apos;t confirm your order</AppText>
          <AppText variant="caption" color="textSecondary">
            Your order for {itemCount} {itemCount === 1 ? 'item' : 'items'} to{' '}
            {pending.request.customer.fullName} may already have been placed. Retry to check: this
            is safe and will not create a duplicate. You can&apos;t place a new order until this is
            confirmed.
          </AppText>
        </>
      ) : null}
      {outcome ? (
        <AppText variant="caption" color={pending ? 'danger' : 'textSecondary'} accessibilityLiveRegion="polite">
          {outcome}
        </AppText>
      ) : null}
      {pending ? (
        <PrimaryButton
          title="Retry order"
          size="small"
          loading={isSubmitting}
          onPress={handleRetry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
});
