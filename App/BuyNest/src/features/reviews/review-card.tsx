import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { SectionCard } from '@/components/ui/section-card';
import type { Review } from '@/services/api/reviews-api';

export function ReviewCard({ review, children }: { review: Review; children?: React.ReactNode }) {
  const origin = review.origin === 'IMPORTED' ? 'Imported review' : review.origin === 'ADMIN_ENTERED' ? 'Shop-entered review' : review.verifiedPurchase ? 'Verified Purchase' : 'Unverified purchase';
  return <SectionCard title={review.title}>
    <AppText color="accent" accessibilityLabel={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</AppText>
    <AppText>{review.content}</AppText>
    <View style={{ gap: 4 }}><AppText variant="captionStrong">{review.reviewerName} · {origin}</AppText>
      {review.sourceLabel && <AppText variant="caption" color="textSecondary">Source: {review.sourceLabel}</AppText>}
      <AppText variant="caption" color="textSecondary">{new Date(review.createdAt).toLocaleDateString('en-IN')}</AppText>
    </View>{children}
  </SectionCard>;
}
