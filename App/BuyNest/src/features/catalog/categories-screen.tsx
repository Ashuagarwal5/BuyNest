import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getActiveCategories } from '@/data/categories';
import { CategoryCard } from '@/features/catalog/components/category-card';

const COLUMNS = 2;

export function CategoriesScreen() {
  const categories = getActiveCategories();

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={categories}
        keyExtractor={(category) => category.id}
        numColumns={COLUMNS}
        contentContainerStyle={styles.content}
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
