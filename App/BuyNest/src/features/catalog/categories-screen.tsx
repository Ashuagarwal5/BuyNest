import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { CategoryCard } from '@/features/catalog/components/category-card';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchCategories } from '@/services/api/catalog-api';

const COLUMNS = 2;

export function CategoriesScreen() {
  const theme = useTheme();
  const categories = useApiData('categories', fetchCategories);

  if (categories.status === 'loading') {
    return (
      <Screen edges={['left', 'right']}>
        <LoadingState />
      </Screen>
    );
  }

  if (categories.status === 'error') {
    return (
      <Screen edges={['left', 'right']}>
        <ErrorState error={categories.error} onRetry={categories.reload} />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={categories.data}
        keyExtractor={(category) => category.id}
        numColumns={COLUMNS}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={categories.isRefreshing}
            onRefresh={categories.reload}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="categories"
            title="No categories yet"
            message="Categories will appear here once they are added."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <CategoryCard category={item} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.two,
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    padding: Spacing.two,
  },
});
