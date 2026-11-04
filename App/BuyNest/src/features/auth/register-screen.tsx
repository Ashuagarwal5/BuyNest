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
  type TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { VerifyCodePanel } from '@/features/auth/components/verify-code-panel';
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
/** DoorKart delivers locally, so mobile numbers are Indian; customers type only the 10 digits. */
const MOBILE_PREFIX = '+91';
const MOBILE_DIGITS = 10;

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
  const mobileInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobileDigits, setMobileDigits] = useState('');
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

  const clearFieldError = (field: keyof RegistrationFieldErrors) => {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const sendRegistration = async () => {
    if (busy.current || (step === 'code' && timers.secondsToResend > 0)) return;
    const validation = validateRegistrationForm({ fullName, mobile: `${MOBILE_PREFIX}${mobileDigits}`, email, termsAccepted });
    const fieldErrors: RegistrationFieldErrors = validation.ok ? {} : { ...validation.errors };
    // The shared validator's message talks about country codes, which this form fills in itself.
    if (mobileDigits.length !== MOBILE_DIGITS) fieldErrors.mobile = `Enter your ${MOBILE_DIGITS}-digit mobile number.`;
    if (!validation.ok || fieldErrors.mobile) {
      setErrors(fieldErrors);
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

  const verify = async (enteredCode: string) => {
    if (busy.current || !submitted || timers.secondsToExpiry <= 0 || failedAttempts >= config.otp.maxAttempts) return;
    if (!/^\d{6}$/.test(enteredCode)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    busy.current = true;
    setIsBusy(true);
    setError(null);
    try {
      const result = await verifyRegistration(submitted.email, enteredCode);
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

  const cardStyle = [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }];
  const termsUrl = shop.status === 'success' ? shop.data.termsUrl : null;
  const privacyUrl = shop.status === 'success' ? shop.data.privacyPolicyUrl : null;

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: step === 'code' ? 'Verify your email' : 'Create account' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!config.registration.enabled ? (
            <View style={cardStyle}>
              <AppText variant="heading">Registration is unavailable</AppText>
              <AppText color="textSecondary">Email registration is not available right now. You can use another enabled sign-in method or continue shopping as a guest.</AppText>
              <PrimaryButton title="Back to sign in" variant="secondary" onPress={goToLogin} />
            </View>
          ) : step === 'created' ? (
            <View style={cardStyle}>
              <View style={[styles.doneIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="success" size={32} color="primary" />
              </View>
              <AppText variant="heading" style={styles.centerText}>Account created</AppText>
              <AppText color="textSecondary" style={styles.centerText}>Sign in with an email code to verify your email and open your account.</AppText>
              <PrimaryButton title="Sign in with an email code" onPress={goToLogin} />
            </View>
          ) : step === 'code' ? (
            <>
              {config.registration.verificationRequired ? <AppText variant="captionStrong" color="primary" style={styles.centerText}>Step 2 of 2</AppText> : null}
              <View style={cardStyle}>
                <VerifyCodePanel
                  email={submitted?.email ?? ''}
                  code={code}
                  onCodeChange={(value) => {
                    setCode(value);
                    if (error) setError(null);
                  }}
                  onVerify={verify}
                  onResend={sendRegistration}
                  onChangeEmail={() => { setStep('profile'); setCode(''); setError(null); timers.reset(); }}
                  changeEmailLabel="Edit details"
                  verifyLabel="Verify and create account"
                  secondsToExpiry={timers.secondsToExpiry}
                  secondsToResend={timers.secondsToResend}
                  error={error}
                  isBusy={isBusy}
                  attemptsExhausted={failedAttempts >= config.otp.maxAttempts}
                />
              </View>
            </>
          ) : (
            <>
              <AuthHeader
                eyebrow={config.registration.verificationRequired ? 'Step 1 of 2' : undefined}
                title="Create your account"
                subtitle="Track orders, save addresses and check out faster."
                showCartNote={isCheckoutNext(next)}
              />

              <View style={cardStyle}>
                <FormField
                  label="Full name"
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChangeText={(value) => { setFullName(value); clearFieldError('fullName'); }}
                  autoComplete="name"
                  textContentType="name"
                  autoCapitalize="words"
                  maxLength={100}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => mobileInput.current?.focus()}
                  editable={!isBusy}
                  error={errors.fullName}
                />
                <FormField
                  ref={mobileInput}
                  label="Mobile number"
                  prefix={MOBILE_PREFIX}
                  placeholder="98765 43210"
                  value={mobileDigits}
                  onChangeText={(value) => { setMobileDigits(value.replace(/\D/g, '').slice(0, MOBILE_DIGITS)); clearFieldError('mobile'); }}
                  keyboardType="phone-pad"
                  autoComplete="tel-national"
                  textContentType="telephoneNumber"
                  maxLength={MOBILE_DIGITS}
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => emailInput.current?.focus()}
                  editable={!isBusy}
                  error={errors.mobile}
                  hint="So we can call you about your delivery."
                />
                <FormField
                  ref={emailInput}
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(value) => { setEmail(value); clearFieldError('email'); }}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={200}
                  returnKeyType="done"
                  editable={!isBusy}
                  error={errors.email}
                  hint={config.registration.verificationRequired ? 'We’ll send a code here to verify it.' : undefined}
                />

                <View style={[styles.optionRow, { borderColor: theme.border }]}>
                  <View style={styles.optionText}>
                    <AppText variant="bodyStrong">Add a delivery address next</AppText>
                    <AppText variant="caption" color="textSecondary">Optional. You can also add one at checkout.</AppText>
                  </View>
                  <Switch
                    value={addAddress}
                    onValueChange={setAddAddress}
                    disabled={isBusy}
                    trackColor={{ true: theme.primary, false: theme.border }}
                    accessibilityLabel="Add a delivery address after signup"
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted, disabled: isBusy }}
                  accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
                  disabled={isBusy}
                  onPress={() => { setTermsAccepted((current) => !current); clearFieldError('termsAccepted'); }}
                  style={styles.termsRow}>
                  <View style={[styles.checkbox, { borderColor: errors.termsAccepted ? theme.danger : theme.primary, backgroundColor: termsAccepted ? theme.primary : theme.surface }]}>
                    {termsAccepted ? <AppText variant="captionStrong" color="textOnPrimary">✓</AppText> : null}
                  </View>
                  <AppText variant="caption" style={styles.optionText}>
                    I agree to the{' '}
                    {termsUrl ? <AppText variant="captionStrong" color="primary" accessibilityRole="link" onPress={() => openPolicy(termsUrl)}>Terms of Service</AppText> : 'Terms of Service'}
                    {' '}and{' '}
                    {privacyUrl ? <AppText variant="captionStrong" color="primary" accessibilityRole="link" onPress={() => openPolicy(privacyUrl)}>Privacy Policy</AppText> : 'Privacy Policy'}.
                  </AppText>
                </Pressable>
                {errors.termsAccepted ? <AppText variant="caption" color="danger" accessibilityRole="alert">{errors.termsAccepted}</AppText> : null}
                {error ? <AppText color="danger" accessibilityRole="alert">{error}</AppText> : null}
                <PrimaryButton title={config.registration.verificationRequired ? 'Continue' : 'Create account'} loading={isBusy} onPress={sendRegistration} />
                {!config.registration.verificationRequired ? (
                  <AppText variant="caption" color="textSecondary" style={styles.centerText}>You’ll verify your email with a sign-in code afterwards.</AppText>
                ) : null}
                <View style={styles.signinRow}>
                  <AppText color="textSecondary">Already have an account?</AppText>
                  <TextLink title="Sign in" disabled={isBusy} onPress={goToLogin} />
                </View>
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
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
  },
  block: { gap: Spacing.three },
  centerText: { textAlign: 'center' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  optionText: { flex: 1 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: MinTouchTarget },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderRadius: Radius.small, alignItems: 'center', justifyContent: 'center' },
  signinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  doneIcon: { width: 64, height: 64, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
