import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { MinTouchTarget, Radius, Spacing, Typography } from '@/constants/theme';
import { ProductCard } from '@/features/catalog/components/product-card';
import { useApiData } from '@/hooks/use-api-data';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { fetchProducts } from '@/services/api/catalog-api';

/** How long typing must pause before a search is sent. */
const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;
const COLUMNS = 2;
const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function SearchScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');

  const typed = text.trim().replace(/\s+/g, ' ');
  const settled = useDebouncedValue(typed, DEBOUNCE_MS);
  // Clearing the box resets at once; only a new search term waits for the pause.
  const term = typed === '' ? '' : settled;

  return (
    <Screen edges={SCREEN_EDGES}>
      <View style={styles.inputRow}>
        <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="search" size={22} color="textSecondary" />
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            accessibilityLabel="Search products"
            placeholder="Search stationery, toys, gifts..."
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: theme.text }]}
          />
          {text.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setText('')}
              hitSlop={Spacing.two}
              style={styles.clear}>
              <Icon name="close" size={22} color="textSecondary" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {term.length < MIN_SEARCH_LENGTH ? (
        <EmptyState
          icon="search"
          title="Search DoorKart"
          message={
            typed.length === 0
              ? 'Find stationery, gifts, toys, sports and decoration items.'
              : `Type at least ${MIN_SEARCH_LENGTH} characters to search.`
          }
        />
      ) : (
        // Keyed by the term so each search starts fresh and a slow old reply cannot win.
        <SearchResults key={term} term={term} />
      )}
    </Screen>
  );
}

function SearchResults({ term }: { term: string }) {
  const theme = useTheme();
  const results = useApiData(`search:${term}`, (signal) => fetchProducts({ search: term }, signal));

  if (results.status === 'loading') {
    return <LoadingState />;
  }
  if (results.status === 'error') {
    return <ErrorState error={results.error} onRetry={results.reload} />;
  }

  const products = results.data;

  return (
    <FlatList
      data={products}
      keyExtractor={(product) => product.id}
      numColumns={COLUMNS}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.results}
      refreshControl={
        <RefreshControl
          refreshing={results.isRefreshing}
          onRefresh={results.reload}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      ListHeaderComponent={
        products.length > 0 ? (
          <AppText variant="caption" color="textSecondary" style={styles.count}>
            {products.length} {products.length === 1 ? 'result' : 'results'} for “{term}”
          </AppText>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="search"
          title="No products found"
          message={`Nothing matched “${term}”. Try a different word.`}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputRow: {
    padding: Spacing.three,
  },
  inputBox: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  input: {
    ...Typography.body,
    // A fixed line height misaligns single-line input text on Android.
    lineHeight: undefined,
    flex: 1,
    minHeight: MinTouchTarget,
    paddingVertical: Spacing.two,
  },
  clear: {
    minWidth: Spacing.five,
    minHeight: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  results: {
    flexGrow: 1,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.three,
  },
  count: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.one,
  },
  // Fixed-fraction cells keep a lone last item at half width instead of stretching.
  cell: {
    width: `${100 / COLUMNS}%`,
    padding: Spacing.two,
  },
});
