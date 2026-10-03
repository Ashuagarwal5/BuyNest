import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { PriceSummary } from '@/components/ui/price-summary';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { Spacing } from '@/constants/theme';
import { getActiveDeliveryAreas } from '@/data/delivery-areas';
import { useCart } from '@/features/cart/cart-context';
import {
  type CheckoutDetails,
  type CheckoutErrors,
  type CheckoutField,
  emptyCheckoutDetails,
  hasErrors,
  validateCheckoutDetails,
} from '@/features/checkout/checkout-details';
import { loadSavedCheckoutDetails, saveCheckoutDetails } from '@/features/checkout/checkout-storage';
import { AddressForm } from '@/features/checkout/components/address-form';
import { DeliveryAreaSelector } from '@/features/checkout/components/delivery-area-selector';
import { PaymentMethodSection } from '@/features/checkout/components/payment-method-section';
import { OrderItemRow } from '@/features/orders/components/order-item-row';
import { useOrders } from '@/features/orders/order-context';
import { useTheme } from '@/hooks/use-theme';
import type { DeliveryArea } from '@/types/delivery';
import type { PaymentMethod } from '@/types/order';
import { formatCurrency } from '@/utils/money';
import {
  calculateOrderTotals,
  getAmountToFreeDelivery,
  getAmountToMinimumOrder,
} from '@/utils/pricing';

// The only method for now; this becomes state once there is more than one to choose from.
const PAYMENT_METHOD: PaymentMethod = 'COD';

export function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { lines, subtotal, isHydrated, clear } = useCart();
  const { placeOrder } = useOrders();

  const [details, setDetails] = useState<CheckoutDetails>(emptyCheckoutDetails);
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const hasEdited = useRef(false);
  // State updates are async, so a ref is what actually stops a fast double tap.
  const isPlacingRef = useRef(false);

  const areas = getActiveDeliveryAreas();

  useEffect(() => {
    let isActive = true;
    loadSavedCheckoutDetails().then((saved) => {
      if (!isActive || !saved || hasEdited.current) {
        return;
      }
      // A remembered area may have been switched off since the last order.
      const isAreaStillServiced = getActiveDeliveryAreas().some(
        (area) => area.id === saved.deliveryAreaId
      );
      setDetails({ ...saved, deliveryAreaId: isAreaStillServiced ? saved.deliveryAreaId : null });
    });
    return () => {
      isActive = false;
    };
  }, []);

  if (!isHydrated) {
    return (
      <Screen edges={['left', 'right', 'bottom']} style={styles.centered}>
        <ActivityIndicator color={theme.primary} />
      </Screen>
    );
  }

  if (lines.length === 0 && !isPlacing) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          message="Add some products before checking out."
          actionLabel="Start shopping"
          onAction={() => router.dismissTo('/')}
        />
      </Screen>
    );
  }

  const selectedArea = areas.find((area) => area.id === details.deliveryAreaId);
  const pricedLines = lines.map((line) => ({
    unitPrice: line.product.sellingPrice,
    quantity: line.quantity,
  }));
  const totals = selectedArea ? calculateOrderTotals(pricedLines, selectedArea) : null;

  const errors = validateCheckoutDetails(details);
  const visibleErrors: CheckoutErrors = {};
  for (const field of Object.keys(errors) as CheckoutField[]) {
    if (hasSubmitted || touched[field]) {
      visibleErrors[field] = errors[field];
    }
  }

  const updateDetails = (changes: Partial<CheckoutDetails>) => {
    hasEdited.current = true;
    setSubmitError(null);
    setDetails((current) => ({ ...current, ...changes }));
  };

  const selectArea = (area: DeliveryArea) => {
    updateDetails({
      deliveryAreaId: area.id,
      // Convenience only: fill the pincode when the area has one and nothing was typed.
      ...(area.pincode && details.pincode === '' ? { pincode: area.pincode } : {}),
    });
  };

  const handlePlaceOrder = async () => {
    if (isPlacingRef.current) {
      return;
    }

    setHasSubmitted(true);
    if (hasErrors(errors)) {
      setSubmitError('Please fix the highlighted details above.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    isPlacingRef.current = true;
    setIsPlacing(true);
    setSubmitError(null);

    const result = await placeOrder({
      lines: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      details,
      paymentMethod: PAYMENT_METHOD,
    });

    if (!result.ok) {
      isPlacingRef.current = false;
      setIsPlacing(false);
      setSubmitError(result.message);
      return;
    }

    // Losing the remembered details only costs convenience, so this is not awaited.
    saveCheckoutDetails(details);
    // replace, not push: Back from the success screen must never return to this form.
    router.replace({ pathname: '/order-success/[id]', params: { id: result.order.id } });
    clear();
  };

  const minimumShortfall = selectedArea ? getAmountToMinimumOrder(subtotal, selectedArea) : 0;
  const freeDeliveryShortfall = selectedArea ? getAmountToFreeDelivery(subtotal, selectedArea) : 0;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <AddressForm
            details={details}
            errors={visibleErrors}
            onChange={(field, value) => updateDetails({ [field]: value })}
            onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
          />

          <SectionCard title="Delivery Area">
            <DeliveryAreaSelector
              areas={areas}
              selectedAreaId={details.deliveryAreaId}
              onSelect={selectArea}
              error={visibleErrors.deliveryAreaId}
            />
            {selectedArea && minimumShortfall > 0 ? (
              <AppText variant="caption" color="danger">
                Minimum order for {selectedArea.name} is{' '}
                {formatCurrency(selectedArea.minimumOrder ?? 0)}. Add{' '}
                {formatCurrency(minimumShortfall)} more to place this order.
              </AppText>
            ) : null}
          </SectionCard>

          <SectionCard title="Order Summary">
            {lines.map((line) => (
              <OrderItemRow
                key={line.product.id}
                name={line.product.name}
                quantity={line.quantity}
                unitPrice={line.product.sellingPrice}
                lineTotal={line.lineTotal}
              />
            ))}
          </SectionCard>

          <SectionCard title="Payment Method">
            <PaymentMethodSection method={PAYMENT_METHOD} />
          </SectionCard>

          <SectionCard title="Price Summary">
            {totals ? (
              <>
                <PriceSummary totals={totals} />
                {freeDeliveryShortfall > 0 && totals.deliveryCharge > 0 ? (
                  <AppText variant="caption" color="textSecondary">
                    Add {formatCurrency(freeDeliveryShortfall)} more for free delivery.
                  </AppText>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <AppText color="textSecondary">Subtotal</AppText>
                  <AppText>{formatCurrency(subtotal)}</AppText>
                </View>
                <AppText variant="caption" color="textSecondary">
                  Select a delivery area to see the delivery charge and total.
                </AppText>
              </>
            )}
          </SectionCard>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {submitError ? (
            <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
              {submitError}
            </AppText>
          ) : null}
          <View style={styles.footerRow}>
            <View>
              <AppText variant="caption" color="textSecondary">
                {totals ? 'Total to pay' : 'Subtotal'}
              </AppText>
              <AppText variant="heading">{formatCurrency(totals?.grandTotal ?? subtotal)}</AppText>
            </View>
            <View style={styles.flex}>
              <PrimaryButton
                title="Place Order"
                loading={isPlacing}
                disabled={areas.length === 0}
                onPress={handlePlaceOrder}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
});
