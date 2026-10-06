import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { toApiError } from '@/services/api/api-error';

/** Who is using the app: a guest with a way to sign in, or the signed-in customer with sign out and delete. */
export function AccountCard() {
  const theme = useTheme();
  const router = useRouter();
  const { state, signOut, deleteAccount } = useAuth();
  const [isBusy, setIsBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert('Could not finish', toApiError(error).message);
    } finally {
      setIsBusy(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      'This removes your sign-in and cannot be undone. Orders you have already placed stay with the shop so it can deliver them.',
      [
        { text: 'Keep my account', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => void run(deleteAccount) },
      ]
    );

  if (state.status === 'loading') {
    return <View style={[styles.card, styles.placeholder, { backgroundColor: theme.primarySoft }]} />;
  }

  const account = state.status === 'signedIn' ? state.account : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.primarySoft }]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
          <Icon name="account" size={32} color="primary" />
        </View>
        <View style={styles.text}>
          {account ? (
            <>
              <AppText variant="heading" numberOfLines={1}>
                {account.fullName ?? 'Welcome back'}
              </AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                {account.email}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="heading">Welcome to DoorKart</AppText>
              <AppText variant="caption" color="textSecondary">
                You are browsing as a guest. Sign in to keep your details on your account.
              </AppText>
            </>
          )}
        </View>
      </View>

      {account ? (
        <View style={styles.actions}>
          <PrimaryButton title="Sign out" variant="secondary" loading={isBusy} onPress={() => void run(signOut)} />
          <PrimaryButton title="Delete my account" variant="danger" size="small" disabled={isBusy} onPress={confirmDelete} />
        </View>
      ) : (
        <PrimaryButton title="Sign in" onPress={() => router.push('/sign-in')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  placeholder: {
    minHeight: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
  actions: {
    gap: Spacing.two,
  },
});
