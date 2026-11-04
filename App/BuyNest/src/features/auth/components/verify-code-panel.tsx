import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextLink } from '@/components/ui/text-link';
import { Radius, Spacing } from '@/constants/theme';
import { OTP_LENGTH, OtpCodeInput } from '@/features/auth/components/otp-code-input';
import { useTheme } from '@/hooks/use-theme';

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type VerifyCodePanelProps = {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  /** Called with the full code, also as soon as the last digit is typed. */
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  changeEmailLabel: string;
  verifyLabel: string;
  secondsToExpiry: number;
  secondsToResend: number;
  error: string | null;
  isBusy: boolean;
  /** Another sign-in is running, or the attempt limit was reached. */
  disabled?: boolean;
  attemptsExhausted: boolean;
};

/** "Check your email" step shared by sign-in and registration. */
export function VerifyCodePanel({
  email,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onChangeEmail,
  changeEmailLabel,
  verifyLabel,
  secondsToExpiry,
  secondsToResend,
  error,
  isBusy,
  disabled = false,
  attemptsExhausted,
}: VerifyCodePanelProps) {
  const theme = useTheme();
  const isExpired = secondsToExpiry <= 0;
  const canVerify = !disabled && !isExpired && !attemptsExhausted;

  const changeCode = (next: string) => {
    onCodeChange(next);
    if (next.length === OTP_LENGTH && next !== code && canVerify && !isBusy) {
      onVerify(next);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
        <Icon name="bell" size={28} color="primary" />
      </View>
      <View style={styles.copy}>
        <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
          Check your email
        </AppText>
        <AppText color="textSecondary" style={styles.centered}>
          Enter the {OTP_LENGTH}-digit code we sent to
        </AppText>
        <AppText variant="bodyStrong" style={styles.centered}>
          {email}
        </AppText>
      </View>

      <OtpCodeInput value={code} onChange={changeCode} hasError={Boolean(error)} editable={!isBusy && !disabled} />

      {error ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert" style={styles.centered}>
          {error}
        </AppText>
      ) : null}
      {attemptsExhausted ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert" style={styles.centered}>
          Too many wrong codes. Request a new code.
        </AppText>
      ) : null}
      <AppText variant="caption" color={isExpired ? 'danger' : 'textSecondary'} style={styles.centered}>
        {isExpired ? 'This code has expired. Request a new one.' : `Code expires in ${formatCountdown(secondsToExpiry)}`}
      </AppText>

      <PrimaryButton title={verifyLabel} loading={isBusy} disabled={!canVerify} onPress={() => onVerify(code)} />

      <View style={styles.links}>
        {secondsToResend > 0 ? (
          <AppText variant="caption" color="textSecondary" style={styles.waitText}>
            Resend code in {formatCountdown(secondsToResend)}
          </AppText>
        ) : (
          <TextLink title="Resend code" disabled={isBusy || disabled} onPress={onResend} />
        )}
        <TextLink title={changeEmailLabel} disabled={isBusy || disabled} onPress={onChangeEmail} />
      </View>
      <AppText variant="caption" color="textSecondary" style={styles.centered}>
        Can’t find it? Check your spam or promotions folder.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.three },
  icon: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  copy: { gap: Spacing.one },
  centered: { textAlign: 'center' },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waitText: { paddingHorizontal: Spacing.two },
});
