import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { MinTouchTarget, Radius, Spacing, Typography } from '@/constants/theme';
import {
  DEFAULT_FILTERS,
  PRICE_PRESETS,
  type ProductFilterState,
  parseRupees,
  SORT_OPTIONS,
} from '@/features/catalog/product-filters';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/types/catalog';

type FilterSheetProps = {
  visible: boolean;
  /** What is applied now: the sheet starts from this each time it opens. */
  applied: ProductFilterState;
  categories: Category[];
  onApply: (next: ProductFilterState) => void;
  onClose: () => void;
};

/** A bottom sheet to sort the product list and narrow it down. Nothing changes until "Apply". */
export function FilterSheet({ visible, applied, categories, onApply, onClose }: FilterSheetProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close filters"
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* Mounted only while open, so every opening starts from what is applied. */}
          {visible ? (
            <SheetContent
              applied={applied}
              categories={categories}
              onApply={onApply}
              onClose={onClose}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function SheetContent({
  applied,
  categories,
  onApply,
  onClose,
}: Omit<FilterSheetProps, 'visible'>) {
  const theme = useTheme();
  const [draft, setDraft] = useState<ProductFilterState>(applied);
  const [minText, setMinText] = useState(applied.minPrice === null ? '' : String(applied.minPrice));
  const [maxText, setMaxText] = useState(applied.maxPrice === null ? '' : String(applied.maxPrice));

  const min = parseRupees(minText);
  const max = parseRupees(maxText);
  const priceError =
    Number.isNaN(min) || Number.isNaN(max)
      ? 'Enter whole rupees, like 250.'
      : min !== null && max !== null && min > max
        ? 'The lowest price is above the highest.'
        : null;

  const set = <K extends keyof ProductFilterState>(key: K, value: ProductFilterState[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const setPrice = (nextMin: number | null, nextMax: number | null) => {
    setMinText(nextMin === null ? '' : String(nextMin));
    setMaxText(nextMax === null ? '' : String(nextMax));
  };

  const clearAll = () => {
    setDraft(DEFAULT_FILTERS);
    setPrice(null, null);
  };

  const apply = () => {
    if (priceError) {
      return;
    }
    onApply({ ...draft, minPrice: min, maxPrice: max });
    onClose();
  };

  const chip = (label: string, isSelected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
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

  const toggleRow = (
    label: string,
    hint: string,
    value: boolean,
    onChange: (next: boolean) => void,
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" color="textSecondary">
          {hint}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.primary, false: theme.border }}
      />
    </View>
  );

  return (
    <>
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
      </View>
      <View style={styles.header}>
        <AppText variant="heading" accessibilityRole="header">
          Sort and filter
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          hitSlop={Spacing.two}>
          <AppText variant="bodyStrong" color="textSecondary">
            ✕
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <AppText variant="bodyStrong">Sort by</AppText>
          {SORT_OPTIONS.map((option) => {
            const isSelected = draft.sort === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => set('sort', option.value)}
                style={styles.radioRow}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: isSelected ? theme.primary : theme.border },
                  ]}>
                  {isSelected ? (
                    <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
                  ) : null}
                </View>
                <AppText>{option.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        {categories.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="bodyStrong">Category</AppText>
            <View style={styles.chips}>
              {chip('All', draft.categorySlug === null, () => set('categorySlug', null))}
              {categories.map((category) =>
                chip(category.name, draft.categorySlug === category.slug, () =>
                  set('categorySlug', category.slug),
                ),
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText variant="bodyStrong">Price</AppText>
          <View style={styles.chips}>
            {PRICE_PRESETS.map((preset) =>
              chip(preset.label, min === preset.min && max === preset.max, () =>
                setPrice(preset.min, preset.max),
              ),
            )}
          </View>
          <View style={styles.priceRow}>
            <PriceInput
              label="Lowest (₹)"
              value={minText}
              onChangeText={setMinText}
              hasError={priceError !== null}
            />
            <AppText color="textSecondary">to</AppText>
            <PriceInput
              label="Highest (₹)"
              value={maxText}
              onChangeText={setMaxText}
              hasError={priceError !== null}
            />
          </View>
          {priceError ? (
            <AppText variant="caption" color="danger" accessibilityRole="alert">
              {priceError}
            </AppText>
          ) : null}
        </View>

        <View style={styles.section}>
          <AppText variant="bodyStrong">Show only</AppText>
          {toggleRow('New arrivals', 'Recently added products', draft.newArrivalsOnly, (next) =>
            set('newArrivalsOnly', next),
          )}
          {toggleRow('Popular', 'Products we recommend', draft.popularOnly, (next) =>
            set('popularOnly', next),
          )}
          {toggleRow('In stock', 'Hide products that are sold out', draft.inStockOnly, (next) =>
            set('inStockOnly', next),
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderColor: theme.border }]}>
        <View style={styles.footerButton}>
          <PrimaryButton title="Clear all" variant="secondary" onPress={clearAll} />
        </View>
        <View style={styles.footerButton}>
          <PrimaryButton title="Apply" disabled={priceError !== null} onPress={apply} />
        </View>
      </View>
    </>
  );
}

function PriceInput({
  label,
  value,
  onChangeText,
  hasError,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hasError: boolean;
}) {
  const theme = useTheme();

  return (
    <TextInput
      accessibilityLabel={label}
      placeholder={label}
      placeholderTextColor={theme.textSecondary}
      value={value}
      onChangeText={(text) => onChangeText(text.replace(/[^\d]/g, '').slice(0, 7))}
      keyboardType="number-pad"
      style={[
        styles.priceInput,
        {
          color: theme.text,
          backgroundColor: theme.background,
          borderColor: hasError ? theme.danger : theme.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 27, 51, 0.45)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: Radius.large + 8,
    borderTopRightRadius: Radius.large + 8,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  body: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: MinTouchTarget - 8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: MinTouchTarget - 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  priceInput: {
    flex: 1,
    minHeight: MinTouchTarget,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    ...Typography.body,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    minHeight: MinTouchTarget,
  },
  toggleText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
  },
});
