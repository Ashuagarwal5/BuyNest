import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PriceSummary } from '@/components/ui/price-summary';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { Spacing } from '@/constants/theme';
import {
  isSameAddress,
  MAX_SAVED_ADDRESSES,
  type SavedAddress,
  toCheckoutDetails,
} from '@/features/addresses/address-types';
import { useAddresses } from '@/features/addresses/addresses-context';
import { useCart } from '@/features/cart/cart-context';
import {
  type CheckoutDetails,
  type CheckoutErrors,
  type CheckoutField,
  emptyCheckoutDetails,
  hasErrors,
  normalizeMobileNumber,
  validateCheckoutDetails,
} from '@/features/checkout/checkout-details';
import { loadSavedCheckoutDetails, saveCheckoutDetails } from '@/features/checkout/checkout-storage';
import { AddressForm } from '@/features/checkout/components/address-form';
import { DeliveryAreaSelector } from '@/features/checkout/components/delivery-area-selector';
import { PaymentMethodSection } from '@/features/checkout/components/payment-method-section';
import { SavedAddressPicker } from '@/features/checkout/components/saved-address-picker';
import { OrderItemRow } from '@/features/orders/components/order-item-row';
import { UnconfirmedOrderNotice } from '@/features/orders/components/unconfirmed-order-notice';
import { useOrders } from '@/features/orders/order-context';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import type { ApiError } from '@/services/api/api-error';
import { fetchDeliveryAreas } from '@/services/api/catalog-api';
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
const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

/**
 * Turns a DEFINITE refusal into what the customer should read and do next. An unknown
 * outcome never reaches here: it is shown by the unconfirmed-order notice instead, which
 * must not say the order failed.
 */
function describeSubmitError(error: ApiError): string {
  switch (error.code) {
    case 'OUT_OF_STOCK':
    case 'PRODUCT_UNAVAILABLE':
    case 'PRODUCT_NOT_FOUND':
      return `${error.message} Please go back and update your cart.`;
    case 'MINIMUM_ORDER_NOT_MET': {
      const details = error.details as { shortfallPaise?: unknown } | undefined;
      return typeof details?.shortfallPaise === 'number'
        ? `Add ${formatCurrency(details.shortfallPaise)} more to reach the minimum order for this area.`
        : error.message;
    }
    default:
      return error.message;
  }
}

export function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { lines, subtotal, isHydrated, clearIfMatches, refreshProducts } = useCart();
  const { submitOrder, pending, pendingReady, isSubmitting } = useOrders();
  const areaList = useApiData('delivery-areas', fetchDeliveryAreas);
  const { addresses, isHydrated: addressesReady, add: addAddress } = useAddresses();

  const [details, setDetails] = useState<CheckoutDetails>(emptyCheckoutDetails);
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The saved address in use, or null while the customer types a different one.
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveForLater, setSaveForLater] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const hasEdited = useRef(false);
  const hasAppliedDefault = useRef(false);

  useEffect(() => {
    let isActive = true;
    loadSavedCheckoutDetails().then((saved) => {
      if (isActive && saved && !hasEdited.current && !hasAppliedDefault.current) {
        setDetails(saved);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  // Once the saved addresses are read, start from the default one (unless the customer has begun typing).
  const applyDefaultAddress = useEffectEvent(() => {
    const preferred = addresses.find((address) => address.isDefault);
    if (preferred && !hasEdited.current) {
      hasAppliedDefault.current = true;
      setDetails(toCheckoutDetails(preferred));
      setSelectedAddressId(preferred.id);
    }
  });
  useEffect(() => {
    if (addressesReady) {
      applyDefaultAddress();
    }
  }, [addressesReady]);

  // The summary below is an estimate, so start it from current prices and stock.
  const refreshCart = useEffectEvent(() => {
    refreshProducts();
  });
  useEffect(() => {
    if (isHydrated) {
      refreshCart();
    }
  }, [isHydrated]);

  // Nothing is shown (or sent) until the device has been checked for an unconfirmed order.
  if (!isHydrated || !pendingReady || areaList.status === 'loading') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <LoadingState />
      </Screen>
    );
  }

  if (lines.length === 0 && !isSubmitting) {
    return (
      <Screen edges={SCREEN_EDGES}>
        {/* The cart can be empty while an earlier order is still unconfirmed. */}
        <View style={styles.emptyNotice}>
          <UnconfirmedOrderNotice navigation="replace" />
        </View>
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

  // Charges and minimums come from the server, so checkout cannot continue without them.
  if (areaList.status === 'error') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <ErrorState error={areaList.error} onRetry={areaList.reload} />
      </Screen>
    );
  }

  const areas = areaList.data;
  // A remembered area that the shop no longer serves is treated as not selected.
  const selectedArea = areas.find((area) => area.id === details.deliveryAreaId);
  const pricedLines = lines.map((line) => ({
    unitPrice: line.product.sellingPrice,
    quantity: line.quantity,
  }));
  const estimate = selectedArea ? calculateOrderTotals(pricedLines, selectedArea) : null;

  const errors = validateCheckoutDetails({ ...details, deliveryAreaId: selectedArea?.id ?? null });
  const visibleErrors: CheckoutErrors = {};
  for (const field of Object.keys(errors) as CheckoutField[]) {
    if (hasSubmitted || touched[field]) {
      visibleErrors[field] = errors[field];
    }
  }

  const updateDetails = (changes: Partial<CheckoutDetails>) => {
    hasEdited.current = true;
    // Typing over a saved address makes it a different address.
    setSelectedAddressId(null);
    setSubmitError(null);
    setDetails((current) => ({ ...current, ...changes }));
  };

  const selectSavedAddress = (address: SavedAddress) => {
    hasEdited.current = true;
    setSubmitError(null);
    setDetails(toCheckoutDetails(address));
    setSelectedAddressId(address.id);
  };

  const useDifferentAddress = () => {
    hasEdited.current = true;
    setSubmitError(null);
    setSelectedAddressId(null);
    setDetails({ ...emptyCheckoutDetails, fullName: details.fullName, phone: details.phone });
  };

  const selectArea = (area: DeliveryArea) => {
    updateDetails({
      deliveryAreaId: area.id,
      // Convenience only: fill the pincode when the area has one and nothing was typed.
      ...(area.pincode && details.pincode === '' ? { pincode: area.pincode } : {}),
    });
  };

  const handlePlaceOrder = async () => {
    setHasSubmitted(true);
    const mobile = normalizeMobileNumber(details.phone);
    if (hasErrors(errors) || !selectedArea || mobile === null) {
      setSubmitError('Please fix the highlighted details above.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSubmitError(null);

    // Only what the customer chose is sent. Prices, totals and the delivery charge are
    // worked out by the server from its own data. The orders context saves this request
    // on the device before sending it, and allows one request at a time.
    const result = await submitOrder({
      customer: { fullName: details.fullName.trim(), mobile },
      address: {
        addressLine1: details.addressLine1.trim(),
        addressLine2: details.addressLine2.trim(),
        landmark: details.landmark.trim(),
        city: details.city.trim(),
        pincode: details.pincode.trim(),
      },
      deliveryAreaId: selectedArea.id,
      items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      paymentMethod: PAYMENT_METHOD,
    });

    if (result.ok) {
      // Losing the remembered details only costs convenience, so this is not awaited.
      saveCheckoutDetails(details);
      // A new address the customer chose to keep joins the address book (once, and within the limit).
      if (
        saveForLater &&
        selectedAddressId === null &&
        addresses.length < MAX_SAVED_ADDRESSES &&
        !addresses.some((address) => isSameAddress(address, details))
      ) {
        addAddress({
          ...details,
          phone: mobile,
          deliveryAreaId: selectedArea.id,
          label: addresses.length === 0 ? 'Home' : 'Other',
          isDefault: addresses.length === 0,
        });
      }
      // replace, not push: Back from the success screen must never return to this form.
      router.replace({ pathname: '/order-success/[id]', params: { id: result.order.orderNumber } });
      // Only the cart this order was made from is cleared, never a newer one.
      clearIfMatches(result.cartFingerprint);
      return;
    }

    switch (result.kind) {
      case 'BUSY':
      case 'NOTHING_PENDING':
        // A request is already on its way (a double tap); nothing to add.
        return;
      case 'UNRESOLVED_ATTEMPT':
        setSubmitError('Please confirm your earlier order first: tap Retry order above.');
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      case 'UNKNOWN':
        // Not a failure: the order may exist. The notice at the top explains and offers a
        // safe retry, so bring it into view.
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      case 'FAILED': {
        // The server refused the order, so nothing was created and the customer can adjust.
        setSubmitError(describeSubmitError(result.error));
        const { code } = result.error;
        if (code === 'OUT_OF_STOCK' || code === 'PRODUCT_UNAVAILABLE' || code === 'PRODUCT_NOT_FOUND') {
          refreshProducts();
        }
        if (code === 'DELIVERY_AREA_UNAVAILABLE' || code === 'DELIVERY_AREA_NOT_FOUND') {
          areaList.reload();
        }
        return;
      }
    }
  };
  const minimumShortfall = selectedArea ? getAmountToMinimumOrder(subtotal, selectedArea) : 0;
  const freeDeliveryShortfall = selectedArea ? getAmountToFreeDelivery(subtotal, selectedArea) : 0;

  return (
    <Screen edges={SCREEN_EDGES}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <UnconfirmedOrderNotice navigation="replace" />

          {addresses.length > 0 ? (
            <SavedAddressPicker
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={selectSavedAddress}
              onUseDifferent={useDifferentAddress}
            />
          ) : null}

          <AddressForm
            details={details}
            errors={visibleErrors}
            onChange={(field, value) => updateDetails({ [field]: value })}
            onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
          />

          <SectionCard title="Delivery Area">
            <DeliveryAreaSelector
              areas={areas}
              selectedAreaId={selectedArea?.id ?? null}
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

          {selectedAddressId === null && addresses.length < MAX_SAVED_ADDRESSES ? (
            <View style={styles.saveRow}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Save this address for next time</AppText>
                <AppText variant="caption" color="textSecondary">
                  Pick it at checkout without typing again.
                </AppText>
              </View>
              <Switch
                accessibilityLabel="Save this address for next time"
                value={saveForLater}
                onValueChange={setSaveForLater}
                trackColor={{ true: theme.primary, false: theme.border }}
              />
            </View>
          ) : null}

          <SectionCard title="Order Summary">
            {lines.map((line) => (
              <View key={line.product.id} style={styles.line}>
                <OrderItemRow
                  name={line.product.name}
                  quantity={line.quantity}
                  unitPrice={line.product.sellingPrice}
                  lineTotal={line.lineTotal}
                />
                {line.issue ? (
                  <AppText variant="captionStrong" color="danger">
                    {line.issue}
                  </AppText>
                ) : null}
              </View>
            ))}
          </SectionCard>

          <SectionCard title="Payment Method">
            <PaymentMethodSection method={PAYMENT_METHOD} />
          </SectionCard>

          <SectionCard title="Price Summary">
            {estimate ? (
              <>
                <PriceSummary totals={estimate} />
                {freeDeliveryShortfall > 0 && estimate.deliveryCharge > 0 ? (
                  <AppText variant="caption" color="textSecondary">
                    Add {formatCurrency(freeDeliveryShortfall)} more for free delivery.
                  </AppText>
                ) : null}
                <AppText variant="caption" color="textSecondary">
                  Estimate based on current prices. The final amount is confirmed when you place
                  the order.
                </AppText>
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
                {estimate ? 'Estimated total' : 'Subtotal'}
              </AppText>
              <AppText variant="heading">{formatCurrency(estimate?.grandTotal ?? subtotal)}</AppText>
            </View>
            <View style={styles.flex}>
              <PrimaryButton
                title="Place Order"
                loading={isSubmitting}
                // A new order cannot be sent while an earlier one is unconfirmed.
                disabled={areas.length === 0 || pending !== null}
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
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  emptyNotice: {
    padding: Spacing.three,
  },
  line: {
    gap: Spacing.one,
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
