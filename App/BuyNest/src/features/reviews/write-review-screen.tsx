import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { useAuth } from '@/features/auth/auth-context';
import { useApiData } from '@/hooks/use-api-data';
import { toApiError } from '@/services/api/api-error';
import { fetchReviewEligibility, saveReview, type Eligibility } from '@/services/api/reviews-api';
import { ReviewAccountGate } from './review-account-gate';
import { ReviewCard } from './review-card';
import { DeleteReviewButton } from './delete-review-button';

export function WriteReviewScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  return <Screen edges={['left', 'right', 'bottom']}><Stack.Screen options={{ title: 'Your review' }} />
    <ReviewAccountGate>{(token) => <ReviewEditor key={`${token}:${productId}`} token={token} productId={productId} />}</ReviewAccountGate>
  </Screen>;
}
function ReviewEditor({ token, productId }: { token: string; productId: string }) {
  const { expireSession } = useAuth(); const [feedback, setFeedback] = useState('');
  const query = useApiData(`review-editor:${token}:${productId}`, async (signal) => {
    try { return await fetchReviewEligibility(token, productId, signal); }
    catch (error) { if (toApiError(error).status === 401) await expireSession(token); throw error; }
  });
  if (query.status === 'loading') return <LoadingState />;
  if (query.status === 'error') return <ErrorState error={query.error} onRetry={query.reload} />;
  const data = query.data;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <AppText variant="title">{data.product.name}</AppText>
      {feedback ? <AppText color="success" accessibilityLiveRegion="polite">{feedback}</AppText> : null}
      {data.existing && <ReviewCard review={data.existing}><AppText variant="captionStrong">Status: {data.existing.status}</AppText>{data.existing.moderationNote && <AppText color="textSecondary">Shop note: {data.existing.moderationNote}</AppText>}</ReviewCard>}
      {!data.policy.enabled ? <AppText>Product reviews are currently disabled.</AppText> : data.previouslyDeleted ? <AppText>You deleted your review. Only one review per account and product is allowed, including deleted reviews.</AppText> : !data.eligible ? <AppText>A delivered purchase on this account is required.{data.policy.requireCollectedPayment ? ' Payment must also be collected.' : ''}{data.policy.purchaseWindowDays ? ` Your purchase must have been delivered within ${data.policy.purchaseWindowDays} days.` : ''}</AppText> : data.existing && !data.existing.canEdit ? <AppText>Editing is unavailable under the current review policy.</AppText> :
        <ReviewForm key={data.existing?.updatedAt ?? 'new'} data={data} token={token} onSaved={(message) => { setFeedback(message); query.reload(); }} />}
      {data.existing?.canDelete && <DeleteReviewButton token={token} id={data.existing.id} onDeleted={() => { setFeedback('Your review was deleted.'); query.reload(); }} />}
      <PrimaryButton variant="secondary" title="Refresh review status" onPress={query.reload} loading={query.isRefreshing} />
    </ScrollView>
  </KeyboardAvoidingView>;
}
function ReviewForm({ data, token, onSaved }: { data: Eligibility; token: string; onSaved: (message: string) => void }) {
  const { expireSession } = useAuth();
  const [rating, setRating] = useState(data.existing?.rating ?? 0);
  const [title, setTitle] = useState(data.existing?.title ?? ''); const [content, setContent] = useState(data.existing?.content ?? '');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const alive = useRef(true); const pending = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const save = async () => {
    if (pending.current) return;
    if (!rating || !title.trim() || !content.trim()) { setError('Choose 1–5 stars and enter a title and review.'); return; }
    pending.current = true; setBusy(true); setError('');
    try {
      const review = await saveReview(token, data.product.id, data.existing?.id ?? null, { rating, title: title.trim(), content: content.trim() });
      if (alive.current) onSaved(review.status === 'PUBLISHED' ? 'Your review is published. Thank you!' : review.status === 'HIDDEN' ? 'Your changes are saved. The review remains hidden by the shop.' : 'Your review was saved and is awaiting approval.');
    } catch (failure) {
      const apiError = toApiError(failure); if (apiError.status === 401) await expireSession(token);
      if (alive.current) setError(apiError.code === 'REVIEW_EXISTS' ? 'Your review already exists. Refresh review status to view it.' : apiError.isOutcomeUnknown ? 'We could not confirm the save. Refresh review status before trying again.' : apiError.message);
    } finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  return <SectionCard title={data.existing ? 'Edit your review' : 'Share your experience'}>
    <AppText variant="captionStrong">Your rating</AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{[1, 2, 3, 4, 5].map((star) => <Pressable key={star} disabled={busy} accessibilityRole="radio" accessibilityLabel={`${star} ${star === 1 ? 'star' : 'stars'}`} accessibilityState={{ checked: rating === star, disabled: busy }} onPress={() => setRating(star)} style={{ minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' }}><AppText color="accent" style={{ fontSize: 32 }}>{rating >= star ? '★' : '☆'}</AppText></Pressable>)}</View>
    <FormField label="Review title" value={title} onChangeText={setTitle} maxLength={120} editable={!busy} placeholder="What stood out?" />
    <FormField label="Your review" value={content} onChangeText={setContent} multiline maxLength={data.policy.maxContentLength} editable={!busy} textAlignVertical="top" style={{ minHeight: 140 }} placeholder="Tell other shoppers about the product" />
    <AppText variant="caption" color="textSecondary">{content.length} / {data.policy.maxContentLength} characters. {data.policy.requireApproval ? 'Reviews are checked before publication. ' : ''}{data.policy.editWindowDays ? `Edits and deletion are available for ${data.policy.editWindowDays} days after submission.` : 'No time limit for deletion.'} {!data.policy.allowEditing ? 'Editing is currently disabled.' : ''}</AppText>
    {error ? <AppText color="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}
    <PrimaryButton title={data.existing ? 'Save changes' : 'Submit review'} loading={busy} onPress={() => void save()} />
  </SectionCard>;
}
