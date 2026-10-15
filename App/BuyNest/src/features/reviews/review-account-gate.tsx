import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/features/auth/auth-context';

export function ReviewAccountGate({ children }: { children: (token: string) => ReactNode }) {
  const { state, retrySession } = useAuth(); const router = useRouter();
  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={retrySession} />;
  if (state.status === 'signedOut') return <View style={{ padding: 24, gap: 16 }}>
    <AppText variant="title">Sign in to review</AppText><AppText>{state.reason === 'expired' ? 'Your session expired. Sign in again to manage your reviews.' : 'Use your DoorKart account to share your experience and manage your reviews.'}</AppText>
    <PrimaryButton title="Sign in" onPress={() => router.push('/sign-in')} />
  </View>;
  return children(state.token);
}
