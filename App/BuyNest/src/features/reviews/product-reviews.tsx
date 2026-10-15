import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionCard } from '@/components/ui/section-card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchReviews, type ReviewSort } from '@/services/api/reviews-api';
import { ReviewCard } from './review-card';

export function ProductReviews({ productId }: { productId: string }) {
  const router = useRouter(); const theme = useTheme();
  const [sort, setSort] = useState<ReviewSort>('recent'); const [page, setPage] = useState(1);
  const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => { setFocus((value) => value + 1); }, []));
  const query = useApiData(`reviews:${productId}:${sort}:${page}:${focus}`, (signal) => fetchReviews(productId, sort, page, signal));
  if (query.status === 'loading') return <SectionCard title="Ratings & reviews"><LoadingState /></SectionCard>;
  if (query.status === 'error') return <SectionCard title="Ratings & reviews"><ErrorState error={query.error} onRetry={query.reload} /></SectionCard>;
  if (!query.data.enabled) return null;
  const { summary, items, pagination } = query.data;
  return <View style={{ gap: 16 }}>
    <SectionCard title="Ratings & reviews">
      <AppText variant="title">{summary.count ? `${summary.average.toFixed(1)} / 5` : 'No ratings yet'}</AppText>
      <AppText color="textSecondary">{summary.count} {summary.count === 1 ? 'rating' : 'ratings'}</AppText>
      {summary.attributedCount > 0 && <AppText variant="caption" color="textSecondary">Includes {summary.attributedCount} clearly labeled shop-entered or imported {summary.attributedCount === 1 ? 'review' : 'reviews'}.</AppText>}
      {summary.distribution.map((bucket) => <View key={bucket.rating} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessible accessibilityLabel={`${bucket.rating} stars: ${bucket.count} ratings`}>
        <AppText variant="caption">{bucket.rating} ★</AppText><View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: theme.border }}><View style={{ width: `${summary.count ? bucket.count / summary.count * 100 : 0}%`, height: 7, borderRadius: 4, backgroundColor: theme.primary }} /></View><AppText variant="caption">{bucket.count}</AppText>
      </View>)}
      <PrimaryButton title="Write or manage your review" onPress={() => router.push({ pathname: '/review/[productId]', params: { productId } })} />
    </SectionCard>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['recent', 'highest', 'lowest'] as const).map((value) => <PrimaryButton key={value} size="small" variant={sort === value ? 'primary' : 'secondary'} title={value === 'recent' ? 'Most recent' : value === 'highest' ? 'Highest rated' : 'Lowest rated'} onPress={() => { setSort(value); setPage(1); }} />)}</View>
    {items.length ? items.map((review) => <ReviewCard key={review.id} review={review} />) : <AppText color="textSecondary">No published reviews yet. Share your experience with this product.</AppText>}
    {pagination.totalPages > 1 && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><PrimaryButton title="Previous" size="small" variant="secondary" disabled={page <= 1} onPress={() => setPage(page - 1)} /><AppText variant="caption">{page} / {pagination.totalPages}</AppText><PrimaryButton title="Next" size="small" variant="secondary" disabled={page >= pagination.totalPages} onPress={() => setPage(page + 1)} /></View>}
  </View>;
}
