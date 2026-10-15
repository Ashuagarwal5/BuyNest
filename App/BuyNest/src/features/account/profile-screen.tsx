import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { Spacing } from '@/constants/theme';
import { AccountCard } from '@/features/account/components/account-card';
import { useAuth } from '@/features/auth/auth-context';
import { isExpoGo, signInWithGoogle } from '@/features/auth/google-sign-in';
import { useApiData } from '@/hooks/use-api-data';
import { toApiError } from '@/services/api/api-error';
import { type Account, fetchAuthConfig } from '@/services/api/auth-api';

const EDGES = ['left', 'right', 'bottom'] as const;

function SignedOutProfile() {
  const router = useRouter();
  return <Screen edges={EDGES}><EmptyState icon="account" title="Sign in to your account"
    message="View and edit your profile after signing in."
    actionLabel="Sign in" onAction={() => router.push('/sign-in')} /></Screen>;
}

export function ProfileScreen() {
  const { state } = useAuth();
  const router = useRouter();
  if (state.status === 'loading') return <Screen edges={EDGES}><LoadingState /></Screen>;
  if (state.status !== 'signedIn') return <SignedOutProfile />;
  const { account } = state;
  return (
    <Screen edges={EDGES}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="My profile">
          <AppText variant="heading">{account.fullName ?? 'Your account'}</AppText>
          <AppText variant="captionStrong" color="textSecondary">Email address</AppText>
          <AppText>{account.email}</AppText>
          <AppText variant="caption" color="textSecondary">{account.emailVerified ? 'Email verified' : 'Email not verified'}</AppText>
          <AppText variant="captionStrong" color="textSecondary">Contact number</AppText>
          <AppText>{account.mobile ?? 'No contact number added'}</AppText>
          {account.mobile ? <AppText variant="caption" color="textSecondary">{account.mobileVerified ? 'Mobile verified' : 'Mobile number not verified'}</AppText> : null}
          <PrimaryButton title="Edit profile" onPress={() => router.push('/edit-profile')} />
        </SectionCard>
        <PrimaryButton title="Saved addresses" variant="secondary" onPress={() => router.push('/addresses')} />
        <PrimaryButton title="My orders" variant="secondary" onPress={() => router.push('/orders')} />
        <PrimaryButton title="Account settings" variant="secondary" onPress={() => router.push('/account-settings')} />
      </ScrollView>
    </Screen>
  );
}

export function EditProfileScreen() {
  const { state } = useAuth();
  if (state.status === 'loading') return <Screen edges={EDGES}><LoadingState /></Screen>;
  if (state.status !== 'signedIn') return <SignedOutProfile />;
  return <ProfileEditor key={state.token} account={state.account} />;
}

function ProfileEditor({ account }: { account: Account }) {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const [fullName, setFullName] = useState(account.fullName ?? '');
  const [mobile, setMobile] = useState(account.mobile ?? '+91');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (busy) return;
    const name = fullName.trim();
    const phone = mobile.trim().replace(/[\s()-]/g, '');
    if (name.length < 2 || name.length > 100) { setError('Enter a full name between 2 and 100 characters.'); return; }
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) { setError('Enter your mobile number with country code, such as +91.'); return; }
    setError(null); setBusy(true);
    try { await updateProfile({ fullName: name, mobile: phone }); router.back(); }
    catch (caught) { setError(toApiError(caught).message); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={EDGES}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SectionCard title="Edit profile">
            <FormField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" maxLength={100} editable={!busy} />
            <FormField label="Mobile number with country code" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" autoComplete="tel" maxLength={25} editable={!busy} />
            <AppText variant="caption" color="textSecondary">{account.email} · {account.emailVerified ? 'Verified email' : 'Unverified email'}</AppText>
            <AppText variant="caption" color="textSecondary">Changing your contact number does not verify it or change previous orders.</AppText>
            {error ? <AppText color="danger" accessibilityRole="alert">{error}</AppText> : null}
            <PrimaryButton title="Save profile" loading={busy} onPress={save} />
          </SectionCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function AccountSettingsScreen() {
  const { state, linkGoogle } = useAuth();
  const config = useApiData('auth-config', (signal) => fetchAuthConfig(signal));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const link = async () => {
    if (busy || config.status !== 'success' || !config.data.google.webClientId) return;
    setBusy(true); setError(null);
    try {
      const result = await signInWithGoogle(config.data.google.webClientId);
      if (result.status === 'cancelled') return;
      if (result.status === 'unavailable') {
        setError(isExpoGo ? 'Link Google in the installed DoorKart app. You can keep using email codes in Expo Go.' : 'Google Play services are unavailable on this phone.');
        return;
      }
      if (result.status !== 'success') { setError('Google verification did not finish. Please try again.'); return; }
      await linkGoogle(result.idToken);
    } catch (caught) { setError(toApiError(caught).message); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={EDGES}>
      <ScrollView contentContainerStyle={styles.content}>
        {state.status === 'signedIn' ? (
          <SectionCard title="Sign-in methods">
            <AppText>Email sign-in uses a one-time code. You do not need a password.</AppText>
            <AppText variant="caption" color="textSecondary">{state.account.googleLinked ? 'Google account linked' : 'Google account not linked'}</AppText>
            {!state.account.googleLinked && config.status === 'success' && config.data.google.enabled ? (
              <View style={styles.content}>
                <AppText variant="caption" color="textSecondary">Choose the Google account with the same verified email as your DoorKart account.</AppText>
                <PrimaryButton title="Link Google account" variant="secondary" loading={busy} onPress={link} />
              </View>
            ) : null}
            {config.status === 'error' ? <PrimaryButton title="Retry sign-in settings" variant="secondary" onPress={config.reload} /> : null}
            {error ? <AppText color="danger" accessibilityRole="alert">{error}</AppText> : null}
          </SectionCard>
        ) : null}
        <AccountCard manageAccount />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { padding: Spacing.three, gap: Spacing.three } });
