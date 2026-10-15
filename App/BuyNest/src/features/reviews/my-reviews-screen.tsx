import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/auth-context';
import { useApiData } from '@/hooks/use-api-data';
import { toApiError } from '@/services/api/api-error';
import { fetchMyReviews } from '@/services/api/reviews-api';
import { ReviewAccountGate } from './review-account-gate';
import { ReviewCard } from './review-card';
import { DeleteReviewButton } from './delete-review-button';

export function MyReviewsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><Stack.Screen options={{ title: 'My reviews' }} /><ReviewAccountGate>{(token) => <MyReviews key={token} token={token} />}</ReviewAccountGate></Screen>;
}
function MyReviews({ token }: { token: string }) {
  const { expireSession } = useAuth(); const router = useRouter();
  const [page, setPage] = useState(1); const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => { setFocus((value) => value + 1); }, []));
  const query = useApiData(`my-reviews:${token}:${page}:${focus}`, async (signal) => {
    try { return await fetchMyReviews(token, page, signal); }
    catch (error) { if (toApiError(error).status === 401) await expireSession(token); throw error; }
  });
  if (query.status === 'loading') return <LoadingState />;
  if (query.status === 'error') return <ErrorState error={query.error} onRetry={query.reload} />;
  return <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} refreshControl={<RefreshControl refreshing={query.isRefreshing} onRefresh={query.reload} />}>
    {!query.data.policy.enabled && <AppText>Product reviews are currently disabled. Your submitted reviews are still available here.</AppText>}
    {!query.data.items.length && <AppText color="textSecondary">No reviews on this page. Open a product to share your experience.</AppText>}
    {query.data.items.map((review) => <View key={review.id} style={{ gap: 12 }}><AppText variant="bodyStrong">{review.productName}</AppText><ReviewCard review={review}><AppText variant="captionStrong">Status: {review.status}</AppText>{review.moderationNote && <AppText color="textSecondary">Shop note: {review.moderationNote}</AppText>}{review.canEdit && <PrimaryButton title="Edit review" variant="secondary" onPress={() => router.push({ pathname: '/review/[productId]', params: { productId: review.productId } })} />}{review.canDelete && <DeleteReviewButton token={token} id={review.id} onDeleted={query.reload} />}</ReviewCard></View>)}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><PrimaryButton title="Previous" size="small" variant="secondary" disabled={page <= 1} onPress={() => setPage(page - 1)} /><AppText variant="caption">{page} / {Math.max(1, query.data.pagination.totalPages)}</AppText><PrimaryButton title="Next" size="small" variant="secondary" disabled={page >= query.data.pagination.totalPages} onPress={() => setPage(page + 1)} /></View>
  </ScrollView>;
}
