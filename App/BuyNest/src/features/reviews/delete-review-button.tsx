import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/features/auth/auth-context';
import { toApiError } from '@/services/api/api-error';
import { deleteReview } from '@/services/api/reviews-api';

export function DeleteReviewButton({ token, id, onDeleted }: { token: string; id: string; onDeleted: () => void }) {
  const { expireSession } = useAuth(); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const remove = async () => {
    if (busy) return; setBusy(true); setError('');
    try { await deleteReview(token, id); if (alive.current) onDeleted(); }
    catch (failure) { const apiError = toApiError(failure); if (apiError.status === 401) await expireSession(token); if (alive.current) setError(apiError.isOutcomeUnknown ? 'Could not confirm deletion. Refresh your reviews to check.' : apiError.message); }
    finally { if (alive.current) setBusy(false); }
  };
  return <View style={{ gap: 12 }}>{confirm ? <><AppText>Delete this review? It will be removed from public ratings. You cannot submit another review for this product.</AppText><PrimaryButton title="Confirm deletion" variant="danger" loading={busy} onPress={() => void remove()} /><PrimaryButton title="Keep review" variant="secondary" disabled={busy} onPress={() => setConfirm(false)} /></> : <PrimaryButton title="Delete review" variant="danger" onPress={() => setConfirm(true)} />}{error ? <AppText color="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}</View>;
}
