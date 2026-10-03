import { useRouter } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { getActiveCategories } from '@/data/categories';
import { getNewArrivals, getPopularProducts } from '@/data/products';
import { CategoryCard } from '@/features/catalog/components/category-card';
import { ProductRail } from '@/features/home/components/product-rail';
import { PromoBanner } from '@/features/home/components/promo-banner';
import { useTheme } from '@/hooks/use-theme';

const SERVICE_POINTS: { icon: IconName; label: string }[] = [
  { icon: 'delivery', label: 'Fast local delivery' },
  { icon: 'cash', label: 'Cash on Delivery available' },
];

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const categories = getActiveCategories();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.padded}>
          <View style={styles.header}>
            <AppText variant="title" color="primary" accessibilityRole="header">
              BuyNest
            </AppText>
            <View style={styles.delivery}>
              <Icon name="location" size={20} color="primary" />
              <View>
                <AppText variant="caption" color="textSecondary">
                  Delivering to
                </AppText>
                <AppText variant="captionStrong">Your local area</AppText>
              </View>
            </View>
          </View>

          <SearchBar placeholder="Search stationery, toys, gifts..." />

          <PromoBanner
            title="Everything you need, delivered locally."
            subtitle="Stationery, gifts, toys, sports and decoration items."
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionHeader
              title="Shop by category"
              actionLabel="See all"
              onAction={() => router.navigate('/categories')}
            />
          </View>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(category) => category.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => <CategoryCard category={item} variant="tile" />}
          />
        </View>

        <ProductRail title="Popular Products" products={getPopularProducts()} />
        <ProductRail title="New Arrivals" products={getNewArrivals()} />

        <View style={styles.padded}>
          <View
            style={[styles.service, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {SERVICE_POINTS.map((point) => (
              <View key={point.label} style={styles.servicePoint}>
                <Icon name={point.icon} size={20} color="primary" />
                <AppText variant="caption" color="textSecondary" style={styles.serviceLabel}>
                  {point.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
  padded: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  delivery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.three,
  },
  categoryList: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  service: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  servicePoint: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  serviceLabel: {
    flex: 1,
  },
});
