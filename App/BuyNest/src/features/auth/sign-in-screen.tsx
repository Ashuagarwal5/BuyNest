import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { FormField } from '@/components/ui/form-field';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { isExpoGo, signInWithGoogle } from '@/features/auth/google-sign-in';
import { useApiData } from '@/hooks/use-api-data';
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
  const { completeSignIn } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);

  const done = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  const continueWithGoogle = async () => {
    const webClientId = config.google.webClientId;
    if (!webClientId || isGoogleBusy) {
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
            ? 'Google sign-in works in the installed DoorKart app, not in Expo Go. For now, use the email code below.'
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
            <AppText variant="title" accessibilityRole="header">
              Sign in to DoorKart
            </AppText>
            <AppText color="textSecondary">
              Keep your details safe on your account. You can still order without signing in.
            </AppText>
          </View>

          {!hasAnyMethod ? (
            <AppText color="textSecondary">Signing in is not available yet. Please check back soon.</AppText>
          ) : null}

          {config.google.enabled ? (
            <View style={styles.block}>
              <PrimaryButton
                title="Continue with Google"
                variant="secondary"
                loading={isGoogleBusy}
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
            <AppText variant="caption" color="textSecondary" style={styles.or}>
              or
            </AppText>
          ) : null}

          {config.emailEnabled ? <EmailCodeFlow onSignedIn={done} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Step 1: type your email. Step 2: type the 6-digit code that was sent to it. */
function EmailCodeFlow({ onSignedIn }: { onSignedIn: () => void }) {
  const { completeSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [secondsToResend, setSecondsToResend] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Counts the resend wait down once a second while it is running.
  useEffect(() => {
    if (secondsToResend <= 0) {
      return;
    }
    const timer = setTimeout(() => setSecondsToResend((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsToResend]);

  const trimmedEmail = email.trim();

  const sendCode = async () => {
    if (isBusy) {
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      const result = await requestEmailCode(trimmedEmail);
      setSecondsToResend(result.resendInSeconds);
      setCode('');
      setStep('code');
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError.message);
      // Asking again too soon: show the code box anyway, because a code is already on its way.
      if (apiError.code === 'TOO_MANY_REQUESTS' && step === 'email') {
        setStep('code');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const verify = async () => {
    if (isBusy) {
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setError(null);
    setIsBusy(true);
    try {
      await completeSignIn(await verifyEmailCode(trimmedEmail, code));
      onSignedIn();
    } catch (caught) {
      setError(toApiError(caught).message);
      setIsBusy(false);
    }
  };

  if (step === 'email') {
    return (
      <View style={styles.block}>
        <FormField
          label="Email"
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
          editable={!isBusy}
        />
        <PrimaryButton title="Email me a code" loading={isBusy} onPress={sendCode} />
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <AppText color="textSecondary">
        We sent a 6-digit code to <AppText variant="bodyStrong">{trimmedEmail}</AppText>. It can take a minute. Check
        your spam folder too.
      </AppText>
      <FormField
        label="6-digit code"
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        returnKeyType="done"
        onSubmitEditing={verify}
        error={error ?? undefined}
        editable={!isBusy}
      />
      <PrimaryButton title="Sign in" loading={isBusy} onPress={verify} />
      <PrimaryButton
        title={secondsToResend > 0 ? `Send a new code in ${secondsToResend}s` : 'Send a new code'}
        variant="secondary"
        disabled={secondsToResend > 0}
        onPress={sendCode}
      />
      <PrimaryButton
        title="Use a different email"
        variant="secondary"
        disabled={isBusy}
        onPress={() => {
          setStep('email');
          setError(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  intro: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  block: {
    gap: Spacing.three,
  },
  or: {
    textAlign: 'center',
  },
});
