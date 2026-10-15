import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { Icon } from '@/components/ui/icon';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
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

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={styles.brandRow}>
              <View style={[styles.brandIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name="store" size={28} color="primary" />
              </View>
              <AppText variant="heading" color="primary">DoorKart</AppText>
            </View>
            <AppText variant="title" accessibilityRole="header">
              Welcome back
            </AppText>
            <AppText color="textSecondary">
              Sign in for easy checkout, saved addresses and your order history.
            </AppText>
            {isCheckoutNext(next) ? (
              <View style={[styles.checkoutNote, { backgroundColor: theme.primarySoft }]}>
                <Icon name="cart" size={20} color="primary" />
                <AppText variant="caption" color="primary" style={styles.noteText}>Your cart is saved. Sign in to continue checkout.</AppText>
              </View>
            ) : null}
          </View>

          {!hasAnyMethod ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="info" size={28} color="primary" />
              <AppText variant="heading">Sign-in is unavailable</AppText>
              <AppText color="textSecondary">Please try again later. You can keep browsing and adding items to your cart.</AppText>
            </View>
          ) : null}

          {config.google.enabled ? (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <AppText variant="bodyStrong">Sign in with Google</AppText>
              <AppText variant="caption" color="textSecondary">Use your Google account to get started quickly.</AppText>
              <PrimaryButton
                title="Continue with Google"
                variant={config.emailEnabled ? 'secondary' : 'primary'}
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
          ) : null}

          {config.google.enabled && config.emailEnabled ? (
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <AppText variant="caption" color="textSecondary">or use your email</AppText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
          ) : null}

          {config.emailEnabled ? (
            <EmailCodeFlow config={config} blocked={isGoogleBusy} onBusyChange={setIsEmailBusy} onSignedIn={done} />
          ) : null}
          {config.registration.enabled ? (
            <View style={styles.signup}>
              <AppText variant="caption" color="textSecondary">New to DoorKart?</AppText>
              <PrimaryButton
                title="Create an account"
                variant="secondary"
                disabled={isGoogleBusy || isEmailBusy}
                onPress={() => router.push(isCheckoutNext(next) ? { pathname: '/register', params: { next: 'checkout' } } : isAddressNext(next) ? { pathname: '/register', params: { next: 'address' } } : '/register')}
              />
            </View>
          ) : null}
          {!config.emailEnabled && hasAnyMethod ? (
            <AppText variant="caption" color="textSecondary" style={styles.centerText}>Email sign-in is currently unavailable. Use Google to sign in.</AppText>
          ) : null}
          <View style={styles.footer}>
            <View style={[styles.brandRow, styles.footerCaption]}>
              <Icon name="account" size={18} color="textSecondary" />
              <AppText variant="caption" color="textSecondary" style={styles.noteText}>Your account, addresses and orders in one place.</AppText>
            </View>
            <Pressable accessibilityRole="button" disabled={isGoogleBusy || isEmailBusy}
              accessibilityState={{ disabled: isGoogleBusy || isEmailBusy }}
              onPress={() => router.dismissTo('/')}
              style={({ pressed }) => [styles.shoppingLink, pressed && styles.pressed]}>
              <AppText variant="captionStrong" color="primary">Continue shopping</AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Step 1: type your email. Step 2: type the 6-digit code that was sent to it. */
function EmailCodeFlow({ config, blocked, onBusyChange, onSignedIn }: {
  config: AuthConfig;
  blocked: boolean;
  onBusyChange: (busy: boolean) => void;
  onSignedIn: () => void;
}) {
  const { completeSignIn } = useAuth();
  const theme = useTheme();
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

  const verify = async () => {
    if (busy.current || blocked || timers.secondsToExpiry <= 0 || failedAttempts >= config.otp.maxAttempts) {
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setError(null);
    busy.current = true;
    setIsBusy(true);
    onBusyChange(true);
    try {
      await completeSignIn(await verifyEmailCode(trimmedEmail, code));
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
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppText variant="heading">Sign in with email</AppText>
        <AppText variant="caption" color="textSecondary">We’ll send a one-time code. No password needed.</AppText>
        <FormField
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
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
        <PrimaryButton title="Send sign-in code" loading={isBusy} disabled={blocked} onPress={sendCode} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.codeIcon, { backgroundColor: theme.primarySoft }]}><Icon name="account" size={28} color="primary" /></View>
      <AppText variant="heading">Check your email</AppText>
      <AppText color="textSecondary">
        We sent a 6-digit code to <AppText variant="bodyStrong">{trimmedEmail}</AppText>. It can take a minute. Check
        your spam folder too.
      </AppText>
      <AppText variant="caption" color={timers.secondsToExpiry > 0 ? 'textSecondary' : 'danger'}>
        {timers.secondsToExpiry > 0 ? `Your code expires in ${timers.secondsToExpiry}s.` : 'This code has expired. Request a new code.'}
      </AppText>
      <FormField
        label="6-digit code"
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        placeholder="000000"
        style={styles.codeInput}
        returnKeyType="done"
        onSubmitEditing={verify}
        error={error ?? undefined}
        editable={!isBusy && !blocked}
      />
      {failedAttempts >= config.otp.maxAttempts ? <AppText color="danger" accessibilityRole="alert">The attempt limit has been reached. Request a new code.</AppText> : null}
      <PrimaryButton title="Verify and sign in" loading={isBusy} disabled={blocked || timers.secondsToExpiry <= 0 || failedAttempts >= config.otp.maxAttempts} onPress={verify} />
      <PrimaryButton
        title={timers.secondsToResend > 0 ? `Send a new code in ${timers.secondsToResend}s` : 'Send a new code'}
        variant="secondary"
        disabled={blocked || isBusy || timers.secondsToResend > 0}
        onPress={sendCode}
      />
      <PrimaryButton
        title="Use a different email"
        variant="secondary"
        disabled={isBusy || blocked}
        onPress={() => {
          setStep('email');
          setError(null);
          setCode('');
          timers.reset();
        }}
      />
    </View>
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
  intro: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  brandIcon: { width: 48, height: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  checkoutNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.medium, marginTop: Spacing.two },
  noteText: { flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dividerLine: { flex: 1, height: 1 },
  signup: { gap: Spacing.two, alignItems: 'stretch' },
  centerText: { textAlign: 'center' },
  footer: { gap: Spacing.one, alignItems: 'center' },
  footerCaption: { width: '100%' },
  shoppingLink: { minHeight: MinTouchTarget, justifyContent: 'center', paddingHorizontal: Spacing.three },
  pressed: { opacity: 0.7 },
  codeIcon: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  codeInput: { textAlign: 'center', letterSpacing: 6, fontSize: 24, minHeight: 56 },
});
