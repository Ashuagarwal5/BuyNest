import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import {
  ADDRESS_LABELS,
  type AddressDraft,
  type AddressLabel,
} from '@/features/addresses/address-types';
import { useAddresses } from '@/features/addresses/addresses-context';
import {
  type CheckoutErrors,
  type CheckoutField,
  emptyCheckoutDetails,
  hasErrors,
  normalizeMobileNumber,
  validateCheckoutDetails,
} from '@/features/checkout/checkout-details';
import { AddressForm } from '@/features/checkout/components/address-form';
import { DeliveryAreaSelector } from '@/features/checkout/components/delivery-area-selector';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchDeliveryAreas } from '@/services/api/catalog-api';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

/** Add a new address, or change a saved one. The route's `id` is "new" or a saved address's id. */
export function AddressEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addresses, isHydrated } = useAddresses();
  const areaList = useApiData('delivery-areas', (signal) => fetchDeliveryAreas(signal));

  const isNew = id === 'new';
  const existing = addresses.find((address) => address.id === id);
  const title = isNew ? 'New Address' : 'Edit Address';

  if (!isHydrated || areaList.status === 'loading') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title }} />
        <LoadingState />
      </Screen>
    );
  }
  if (areaList.status === 'error') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title }} />
        <ErrorState error={areaList.error} onRetry={areaList.reload} />
      </Screen>
    );
  }
  if (!isNew && !existing) {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title }} />
        <EmptyState icon="location" title="Address not found" message="It may have been deleted." />
      </Screen>
    );
  }

  // Mounted only now, so the form always starts from the loaded address.
  return (
    <EditorForm
      title={title}
      areas={areaList.data}
      initial={
        existing
          ? { ...existing }
          : {
              ...emptyCheckoutDetails,
              label: addresses.length === 0 ? 'Home' : 'Other',
              isDefault: addresses.length === 0,
            }
      }
      editingId={existing?.id ?? null}
    />
  );
}

function EditorForm({
  title,
  areas,
  initial,
  editingId,
}: {
  title: string;
  areas: Awaited<ReturnType<typeof fetchDeliveryAreas>>;
  initial: AddressDraft;
  editingId: string | null;
}) {
  const theme = useTheme();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const { add, update } = useAddresses();
  const scrollRef = useRef<ScrollView>(null);

  const [draft, setDraft] = useState<AddressDraft>(initial);
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // A remembered area the shop no longer serves counts as not chosen.
  const selectedArea = areas.find((area) => area.id === draft.deliveryAreaId);
  const errors = validateCheckoutDetails({ ...draft, deliveryAreaId: selectedArea?.id ?? null });
  const visibleErrors: CheckoutErrors = {};
  for (const field of Object.keys(errors) as CheckoutField[]) {
    if (hasSubmitted || touched[field]) {
      visibleErrors[field] = errors[field];
    }
  }

  const change = (changes: Partial<AddressDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const save = () => {
    setHasSubmitted(true);
    const mobile = normalizeMobileNumber(draft.phone);
    if (hasErrors(errors) || !selectedArea || mobile === null) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const clean: AddressDraft = {
      label: draft.label,
      isDefault: draft.isDefault,
      fullName: draft.fullName.trim(),
      phone: mobile,
      addressLine1: draft.addressLine1.trim(),
      addressLine2: draft.addressLine2.trim(),
      landmark: draft.landmark.trim(),
      city: draft.city.trim(),
      pincode: draft.pincode.trim(),
      deliveryAreaId: selectedArea.id,
    };

    if (editingId) {
      update(editingId, clean);
    } else if (add(clean) === 'full') {
      Alert.alert('Address book is full', 'Delete a saved address to add another.');
      return;
    }
    router.back();
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <SectionCard title="Save as">
            <View style={styles.chips}>
              {ADDRESS_LABELS.map((label: AddressLabel) => {
                const isSelected = draft.label === label;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => change({ label })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.background,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}>
                    <AppText variant="captionStrong" color={isSelected ? 'textOnPrimary' : 'text'}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>

          <AddressForm
            details={draft}
            errors={visibleErrors}
            onChange={(field, value) => change({ [field]: value })}
            onBlur={(field) => setTouched((current) => ({ ...current, [field]: true }))}
          />

          <SectionCard title="Delivery Area">
            <DeliveryAreaSelector
              areas={areas}
              selectedAreaId={selectedArea?.id ?? null}
              onSelect={(area) =>
                change({
                  deliveryAreaId: area.id,
                  ...(area.pincode && draft.pincode === '' ? { pincode: area.pincode } : {}),
                })
              }
              error={visibleErrors.deliveryAreaId}
            />
          </SectionCard>

          <View style={styles.defaultRow}>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Make this my default address</AppText>
              <AppText variant="caption" color="textSecondary">
                Checkout starts with it.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Make this my default address"
              value={draft.isDefault}
              onValueChange={(isDefault) => change({ isDefault })}
              trackColor={{ true: theme.primary, false: theme.border }}
            />
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <PrimaryButton title={editingId ? 'Save changes' : 'Save address'} onPress={save} />
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
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    minHeight: MinTouchTarget - 8,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
    minHeight: MinTouchTarget,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
