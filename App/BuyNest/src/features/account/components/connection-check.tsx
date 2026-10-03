import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toApiError } from '@/services/api/api-error';
import { checkApiHealth } from '@/services/api/catalog-api';
import { API_BASE_URL } from '@/services/api/config';

type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok' }
  | { status: 'failed'; message: string };

/**
 * Troubleshooting aid: shows which server the app is pointed at and checks it on demand.
 * It only runs when tapped; nothing polls the server in the background.
 */
export function ConnectionCheck() {
  const theme = useTheme();
  const [check, setCheck] = useState<CheckState>({ status: 'idle' });

  const runCheck = async () => {
    setCheck({ status: 'checking' });
    try {
      await checkApiHealth();
      setCheck({ status: 'ok' });
    } catch (error) {
      setCheck({ status: 'failed', message: toApiError(error).message });
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <AppText variant="bodyStrong">Server connection</AppText>
      <AppText variant="caption" color="textSecondary">
        {API_BASE_URL}
      </AppText>
      {check.status === 'ok' ? (
        <AppText variant="captionStrong" color="success" accessibilityLiveRegion="polite">
          Connected. The shop server is reachable.
        </AppText>
      ) : null}
      {check.status === 'failed' ? (
        <AppText variant="captionStrong" color="danger" accessibilityLiveRegion="polite">
          {check.message}
        </AppText>
      ) : null}
      <PrimaryButton
        title="Check connection"
        size="small"
        variant="secondary"
        loading={check.status === 'checking'}
        onPress={runCheck}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
