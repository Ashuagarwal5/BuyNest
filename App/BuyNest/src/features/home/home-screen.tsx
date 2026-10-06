import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { CategoryCard } from '@/features/catalog/components/category-card';
import { ProductRail } from '@/features/home/components/product-rail';
import { PromoBanner } from '@/features/home/components/promo-banner';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchCategories, fetchProducts } from '@/services/api/catalog-api';

const SERVICE_POINTS: { icon: IconName; label: string }[] = [
  { icon: 'delivery', label: 'Fast local delivery' },
  { icon: 'cash', label: 'Cash on Delivery available' },
];

/** How many products a category row shows on the home screen; "View all" opens the rest. */
const HOME_ROW_SIZE = 10;

async function loadHome(signal: AbortSignal) {
  const [categories, popular, newArrivals] = await Promise.all([
    fetchCategories(signal),
    fetchProducts({ featured: true }, signal),
    fetchProducts({ isNew: true }, signal),
  ]);
  const categoryRows = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: (await fetchProducts({ categorySlug: category.slug }, signal)).slice(0, HOME_ROW_SIZE),
    }))
  );
  return { categories, popular, newArrivals, categoryRows };
}

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const home = useApiData('home', loadHome);

  const header = (
    <View style={styles.padded}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image
            source={require('../../../assets/images/favicon.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <AppText variant="title" color="primary" accessibilityRole="header">
            DoorKart
          </AppText>
        </View>
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

      <SearchBar
        placeholder="Search stationery, toys, gifts..."
        onPress={() => router.push('/search')}
      />
    </View>
  );

  if (home.status !== 'success') {
    return (
      <Screen style={styles.pending}>
        {header}
        {home.status === 'loading' ? (
          <LoadingState />
        ) : (
          <ErrorState error={home.error} onRetry={home.reload} />
        )}
      </Screen>
    );
  }

  const { categories, popular, newArrivals, categoryRows } = home.data;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={home.isRefreshing}
            onRefresh={home.reload}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        {header}

        <View style={styles.padded}>
          <PromoBanner
            title="Everything you need, delivered locally."
            subtitle="Stationery, gifts, toys, sports and decoration items."
          />
        </View>

        {categories.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionHeader
                title="Shop by category"
                actionLabel="See all"
                onAction={() => router.navigate('/products')}
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
        ) : null}

        <ProductRail
          title="Popular Products"
          products={popular}
          onViewAll={() => router.push({ pathname: '/collection/[kind]', params: { kind: 'popular' } })}
        />
        <ProductRail
          title="New Arrivals"
          products={newArrivals}
          onViewAll={() => router.push({ pathname: '/collection/[kind]', params: { kind: 'new' } })}
        />
        {categoryRows.map(({ category, products }) => (
          <ProductRail
            key={category.id}
            title={category.name}
            products={products}
            onViewAll={() => router.push({ pathname: '/category/[slug]', params: { slug: category.slug } })}
          />
        ))}

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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
  },
  content: {
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
  pending: {
    paddingTop: Spacing.three,
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
