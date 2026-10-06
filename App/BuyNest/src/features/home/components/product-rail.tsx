import { FlatList, StyleSheet, View } from 'react-native';

import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { ProductCard } from '@/features/catalog/components/product-card';
import type { Product } from '@/types/catalog';

type ProductRailProps = {
  title: string;
  products: Product[];
  /** Shows a "View all" button on the right of the title when given. */
  onViewAll?: () => void;
};

const CARD_WIDTH = 164;

/** Titled horizontal list of product cards. Renders nothing when there are no products. */
export function ProductRail({ title, products, onViewAll }: ProductRailProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SectionHeader title={title} actionLabel="View all" onAction={onViewAll} />
      </View>
      <FlatList
        horizontal
        data={products}
        keyExtractor={(product) => product.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} style={styles.card} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  header: {
    paddingHorizontal: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
    // Room for the card shadow, which the horizontal list would otherwise clip.
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  card: {
    width: CARD_WIDTH,
  },
});
