import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import {
  isAddressNext,
  isCheckoutNext,
  type RegistrationFieldErrors,
  type RegistrationInput,
  validateRegistrationForm,
} from '@/features/auth/registration-form';
import { useOtpTimers } from '@/features/auth/use-otp-timers';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { toApiError } from '@/services/api/api-error';
import { type AuthConfig, fetchAuthConfig, registerAccount, verifyRegistration } from '@/services/api/auth-api';
import { fetchShopInfo } from '@/services/api/catalog-api';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

export function RegisterScreen() {
  const config = useApiData('registration-config', (signal) => fetchAuthConfig(signal));
  const { state } = useAuth();
  const router = useRouter();

  if (config.status === 'loading' || state.status === 'loading') {
    return <Screen edges={SCREEN_EDGES}><LoadingState /></Screen>;
  }
  if (config.status === 'error') {
    return <Screen edges={SCREEN_EDGES}><ErrorState error={config.error} onRetry={config.reload} /></Screen>;
  }
  if (state.status === 'signedIn') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <View style={styles.content}>
          <AppText variant="heading">You are already signed in</AppText>
          <PrimaryButton title="Go to my account" onPress={() => router.replace('/account')} />
        </View>
      </Screen>
    );
  }
  return <RegistrationForm config={config.data} />;
}

function RegistrationForm({ config }: { config: AuthConfig }) {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const { completeSignIn } = useAuth();
  const theme = useTheme();
  const shop = useApiData('registration-policies', (signal) => fetchShopInfo(signal));
  const timers = useOtpTimers();
  const busy = useRef(false);
  const mounted = useRef(true);
  const [isBusy, setIsBusy] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [addAddress, setAddAddress] = useState(isAddressNext(next));
  const [errors, setErrors] = useState<RegistrationFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'profile' | 'code' | 'created'>('profile');
  const [submitted, setSubmitted] = useState<RegistrationInput | null>(null);
  const [code, setCode] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const goToLogin = () => router.replace(isCheckoutNext(next) ? { pathname: '/sign-in', params: { next: 'checkout' } } : addAddress ? { pathname: '/sign-in', params: { next: 'address' } } : '/sign-in');

  const sendRegistration = async () => {
    if (busy.current || (step === 'code' && timers.secondsToResend > 0)) return;
    const validation = validateRegistrationForm({ fullName, mobile, email, termsAccepted });
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    busy.current = true;
    setIsBusy(true);
    setErrors({});
    setError(null);
    try {
      const input = step === 'code' && submitted ? submitted : validation.input;
      const result = await registerAccount(input);
      if (!mounted.current) return;
      setSubmitted(input);
      setCode('');
      setFailedAttempts(0);
      if (result.verificationRequired) {
        timers.start(result.expiresInSeconds ?? config.otp.expiresInSeconds, result.resendInSeconds ?? config.otp.resendInSeconds);
        setStep('code');
      } else {
        timers.reset();
        setStep('created');
      }
    } catch (caught) {
      if (mounted.current) setError(toApiError(caught).message);
    } finally {
      busy.current = false;
      if (mounted.current) setIsBusy(false);
    }
  };

  const verify = async () => {
    if (busy.current || !submitted || timers.secondsToExpiry <= 0 || failedAttempts >= config.otp.maxAttempts) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    busy.current = true;
    setIsBusy(true);
    setError(null);
    try {
      const result = await verifyRegistration(submitted.email, code);
      if (!mounted.current) return;
      await completeSignIn(result);
      router.replace(addAddress ? { pathname: '/address/[id]', params: { id: 'new', ...(isCheckoutNext(next) ? { next: 'checkout' } : {}) } } : isCheckoutNext(next) ? '/checkout' : '/account');
    } catch (caught) {
      if (!mounted.current) return;
      const apiError = toApiError(caught);
      setError(apiError.message);
      if (apiError.code === 'INVALID_OTP') setFailedAttempts((current) => current + 1);
    } finally {
      busy.current = false;
      if (mounted.current) setIsBusy(false);
    }
  };

  const openPolicy = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', 'This phone could not open the link.');
    }
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: step === 'code' ? 'Verify your email' : 'Create account' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <AppText variant="title" accessibilityRole="header">Join DoorKart</AppText>
            <AppText color="textSecondary">Keep your profile, addresses and new orders on your account. You can add a delivery address later.</AppText>
          </View>

          {!config.registration.enabled ? (
            <SectionCard title="Registration is unavailable">
              <AppText color="textSecondary">Email registration is not available right now. You can use another enabled sign-in method or continue shopping as a guest.</AppText>
              <PrimaryButton title="Back to sign in" variant="secondary" onPress={goToLogin} />
            </SectionCard>
          ) : step === 'created' ? (
            <SectionCard title="Account created">
              <AppText color="textSecondary">Your account was created. Sign in with an email code to verify your email and access your account.</AppText>
              <PrimaryButton title="Sign in with an email code" onPress={goToLogin} />
            </SectionCard>
          ) : step === 'code' ? (
            <SectionCard title="Verify your email">
              <AppText color="textSecondary">We sent a 6-digit code to {submitted?.email}. Check your inbox and spam folder.</AppText>
              <AppText variant="caption" color={timers.secondsToExpiry > 0 ? 'textSecondary' : 'danger'}>
                {timers.secondsToExpiry > 0 ? `Your code expires in ${timers.secondsToExpiry}s.` : 'This code has expired. Request a new code.'}
              </AppText>
              <FormField
                label="6-digit code"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                editable={!isBusy}
                error={error ?? undefined}
                onSubmitEditing={verify}
                returnKeyType="done"
              />
              {failedAttempts >= config.otp.maxAttempts ? <AppText color="danger" accessibilityRole="alert">The attempt limit has been reached. Request a new code.</AppText> : null}
              <PrimaryButton title="Verify and create account" loading={isBusy} disabled={timers.secondsToExpiry <= 0 || failedAttempts >= config.otp.maxAttempts} onPress={verify} />
              <PrimaryButton
                title={timers.secondsToResend > 0 ? `Resend code in ${timers.secondsToResend}s` : 'Send a new code'}
                variant="secondary"
                disabled={isBusy || timers.secondsToResend > 0}
                onPress={sendRegistration}
              />
              <PrimaryButton title="Edit registration details" variant="secondary" disabled={isBusy} onPress={() => { setStep('profile'); setCode(''); setError(null); timers.reset(); }} />
            </SectionCard>
          ) : (
            <>
              <SectionCard title="Your details">
                <FormField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" autoCapitalize="words" maxLength={100} editable={!isBusy} error={errors.fullName} />
                <FormField label="Mobile number with country code" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={30} editable={!isBusy} error={errors.mobile} />
                <AppText variant="caption" color="textSecondary">Include your country code. This number is saved as contact information; it is not verified by SMS.</AppText>
                <FormField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false} maxLength={200} editable={!isBusy} error={errors.email} />
              </SectionCard>
              <SectionCard title="Delivery address">
                <View style={styles.row}>
                  <AppText style={styles.rowLabel}>Add a delivery address after signup</AppText>
                  <Switch value={addAddress} onValueChange={setAddAddress} disabled={isBusy} accessibilityLabel="Add a delivery address after signup" />
                </View>
                <AppText variant="caption" color="textSecondary">Optional. You can also add an address during checkout.</AppText>
              </SectionCard>
              <View style={styles.block}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted, disabled: isBusy }}
                  accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
                  disabled={isBusy}
                  onPress={() => setTermsAccepted((current) => !current)}
                  style={styles.row}>
                  <View style={[styles.checkbox, { borderColor: theme.primary, backgroundColor: termsAccepted ? theme.primary : theme.surface }]}>
                    {termsAccepted ? <AppText color="textOnPrimary">✓</AppText> : null}
                  </View>
                  <AppText style={styles.rowLabel}>I agree to the Terms of Service and Privacy Policy.</AppText>
                </Pressable>
                {errors.termsAccepted ? <AppText variant="caption" color="danger" accessibilityRole="alert">{errors.termsAccepted}</AppText> : null}
                {shop.status === 'success' ? (
                  <View style={styles.links}>
                    {shop.data.termsUrl ? <PrimaryButton title="Terms of Service" size="small" variant="secondary" onPress={() => openPolicy(shop.data.termsUrl ?? '')} /> : null}
                    {shop.data.privacyPolicyUrl ? <PrimaryButton title="Privacy Policy" size="small" variant="secondary" onPress={() => openPolicy(shop.data.privacyPolicyUrl ?? '')} /> : null}
                  </View>
                ) : null}
                {error ? <AppText color="danger" accessibilityRole="alert">{error}</AppText> : null}
                <AppText variant="caption" color="textSecondary">
                  {config.registration.verificationRequired ? 'Verify your email code to complete registration. No password is required.' : 'Registration creates an account. Email-code verification is still required before you can sign in.'}
                </AppText>
                <PrimaryButton title={config.registration.verificationRequired ? 'Create account and send code' : 'Create account'} loading={isBusy} onPress={sendRegistration} />
                <PrimaryButton title="Already have an account? Sign in" variant="secondary" disabled={isBusy} onPress={goToLogin} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  intro: { gap: Spacing.two, paddingVertical: Spacing.two },
  block: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: MinTouchTarget },
  rowLabel: { flex: 1 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderRadius: Radius.small, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
