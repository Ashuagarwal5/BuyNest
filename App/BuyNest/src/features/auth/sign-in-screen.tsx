import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { VerifyCodePanel } from '@/features/auth/components/verify-code-panel';
import { isExpoGo, signInWithGoogle } from '@/features/auth/google-sign-in';
import { isAddressNext, isCheckoutNext } from '@/features/auth/registration-form';
import { useOtpTimers } from '@/features/auth/use-otp-timers';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { toApiError } from '@/services/api/api-error';
import {
  type AuthConfig,
  fetchAuthConfig,
  requestEmailCode,
  signInWithGoogleToken,
  verifyEmailCode,
} from '@/services/api/auth-api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInScreen() {
  const config = useApiData('auth-config', (signal) => fetchAuthConfig(signal));

  if (config.status === 'loading') {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <LoadingState />
      </Screen>
    );
  }
  if (config.status === 'error') {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState error={config.error} onRetry={config.reload} />
      </Screen>
    );
  }
  return <SignInOptions config={config.data} />;
}

function SignInOptions({ config }: { config: AuthConfig }) {
  const router = useRouter();
  const theme = useTheme();
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const { completeSignIn } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const [isEmailBusy, setIsEmailBusy] = useState(false);

  const done = () => {
    if (isCheckoutNext(next)) {
      router.replace('/checkout');
    } else if (isAddressNext(next)) {
      router.replace({ pathname: '/address/[id]', params: { id: 'new' } });
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/account');
    }
  };

  const continueWithGoogle = async () => {
    const webClientId = config.google.webClientId;
    if (!webClientId || isGoogleBusy || isEmailBusy) {
      return;
    }
    setGoogleError(null);
    setIsGoogleBusy(true);
    try {
      const google = await signInWithGoogle(webClientId);
      if (google.status === 'cancelled') {
        return;
      }
      if (google.status === 'unavailable') {
        setGoogleError(
          isExpoGo
            ? config.emailEnabled
              ? 'Use an email code below, or open the installed DoorKart app to sign in with Google.'
              : 'Open the installed DoorKart app to sign in with Google. Google sign-in is unavailable in Expo Go.'
            : 'Google sign-in needs Google Play services on this phone.'
        );
        return;
      }
      if (google.status === 'failed') {
        setGoogleError('Google sign-in did not work. Please try again.');
        return;
      }
      await completeSignIn(await signInWithGoogleToken(google.idToken));
      done();
    } catch (error) {
      setGoogleError(toApiError(error).message);
    } finally {
      setIsGoogleBusy(false);
    }
  };

  const hasAnyMethod = config.google.enabled || config.emailEnabled;
  const isBusy = isGoogleBusy || isEmailBusy;
  const cardStyle = [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }];

  const googleSection = config.google.enabled ? (
    <View style={styles.section}>
      {config.emailEnabled ? (
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <AppText variant="caption" color="textSecondary">or</AppText>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>
      ) : null}
      <PrimaryButton
        title="Continue with Google"
        variant="secondary"
        icon={
          <Image
            source={require('../../../assets/images/google-g.svg')}
            style={styles.googleIcon}
            contentFit="contain"
            accessible={false}
          />
        }
        loading={isGoogleBusy}
        disabled={isEmailBusy}
        onPress={continueWithGoogle}
      />
      {googleError ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {googleError}
        </AppText>
      ) : null}
    </View>
  ) : null;

  const openRegistration = () =>
    router.push(
      isCheckoutNext(next)
        ? { pathname: '/register', params: { next: 'checkout' } }
        : isAddressNext(next)
          ? { pathname: '/register', params: { next: 'address' } }
          : '/register'
    );

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHeader
            title="Welcome to DoorKart"
            subtitle="Sign in for faster checkout, saved addresses and order tracking."
            showCartNote={isCheckoutNext(next)}
          />

          {!hasAnyMethod ? (
            <View style={cardStyle}>
              <Icon name="info" size={28} color="primary" />
              <AppText variant="heading">Sign-in is unavailable</AppText>
              <AppText color="textSecondary">Please try again later. You can keep browsing and adding items to your cart.</AppText>
            </View>
          ) : config.emailEnabled ? (
            <View style={cardStyle}>
              <EmailCodeFlow
                config={config}
                blocked={isGoogleBusy}
                onBusyChange={setIsEmailBusy}
                onSignedIn={done}
                googleSection={googleSection}
              />
            </View>
          ) : (
            <View style={cardStyle}>
              {googleSection}
              <AppText variant="caption" color="textSecondary" style={styles.centerText}>
                Email sign-in is currently unavailable.
              </AppText>
            </View>
          )}

          {config.registration.enabled ? (
            <View style={styles.signup}>
              <AppText color="textSecondary">New to DoorKart?</AppText>
              <TextLink title="Create an account" disabled={isBusy} onPress={openRegistration} />
            </View>
          ) : null}

          <View style={styles.footer}>
            <TextLink title="Continue shopping as a guest" disabled={isBusy} onPress={() => router.dismissTo('/')} />
            <View style={styles.trustRow}>
              <Icon name="account" size={16} color="textSecondary" />
              <AppText variant="caption" color="textSecondary">No password needed. Sign in with a one-time code.</AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Step 1: type your email. Step 2: type the 6-digit code that was sent to it. */
function EmailCodeFlow({ config, blocked, onBusyChange, onSignedIn, googleSection }: {
  config: AuthConfig;
  blocked: boolean;
  onBusyChange: (busy: boolean) => void;
  onSignedIn: () => void;
  /** Other sign-in options, shown below the email button on the first step only. */
  googleSection: ReactNode;
}) {
  const { completeSignIn } = useAuth();
  const busy = useRef(false);
  const timers = useOtpTimers();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const trimmedEmail = email.trim();

  const sendCode = async () => {
    if (busy.current || blocked || (step === 'code' && timers.secondsToResend > 0)) {
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    busy.current = true;
    setIsBusy(true);
    onBusyChange(true);
    try {
      const result = await requestEmailCode(trimmedEmail);
      timers.start(result.expiresInSeconds, result.resendInSeconds);
      setCode('');
      setFailedAttempts(0);
      setStep('code');
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError.message);
      // Asking again too soon: show the code box anyway, because a code is already on its way.
      if (apiError.code === 'TOO_MANY_REQUESTS' && step === 'email') {
        timers.start(config.otp.expiresInSeconds, config.otp.resendInSeconds);
        setStep('code');
      }
    } finally {
      busy.current = false;
      setIsBusy(false);
      onBusyChange(false);
    }
  };

  const verify = async (enteredCode: string) => {
    if (busy.current || blocked || timers.secondsToExpiry <= 0 || failedAttempts >= config.otp.maxAttempts) {
      return;
    }
    if (!/^\d{6}$/.test(enteredCode)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setError(null);
    busy.current = true;
    setIsBusy(true);
    onBusyChange(true);
    try {
      await completeSignIn(await verifyEmailCode(trimmedEmail, enteredCode));
      onSignedIn();
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError.message);
      if (apiError.code === 'INVALID_OTP') setFailedAttempts((current) => current + 1);
    } finally {
      busy.current = false;
      setIsBusy(false);
      onBusyChange(false);
    }
  };

  if (step === 'email') {
    return (
      <View style={styles.section}>
        <FormField
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={sendCode}
          error={error ?? undefined}
          editable={!isBusy && !blocked}
        />
        <PrimaryButton title="Continue with email" loading={isBusy} disabled={blocked} onPress={sendCode} />
        <AppText variant="caption" color="textSecondary" style={styles.centerText}>
          We’ll email you a 6-digit code to sign in.
        </AppText>
        {googleSection}
      </View>
    );
  }

  return (
    <VerifyCodePanel
      email={trimmedEmail}
      code={code}
      onCodeChange={(next) => {
        setCode(next);
        if (error) setError(null);
      }}
      onVerify={verify}
      onResend={sendCode}
      onChangeEmail={() => {
        setStep('email');
        setError(null);
        setCode('');
        timers.reset();
      }}
      changeEmailLabel="Change email"
      verifyLabel="Verify and sign in"
      secondsToExpiry={timers.secondsToExpiry}
      secondsToResend={timers.secondsToResend}
      error={error}
      isBusy={isBusy}
      disabled={blocked}
      attemptsExhausted={failedAttempts >= config.otp.maxAttempts}
    />
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
  section: { gap: Spacing.three },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  googleIcon: { width: 20, height: 20 },
  signup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  centerText: { textAlign: 'center' },
  footer: { alignItems: 'center', gap: Spacing.one },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
