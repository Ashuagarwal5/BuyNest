import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { MAX_SAVED_ADDRESSES, type SavedAddress } from '@/features/addresses/address-types';
import { useAddresses } from '@/features/addresses/addresses-context';
import { AddressCard } from '@/features/addresses/components/address-card';
import { useAuth } from '@/features/auth/auth-context';
import { toApiError } from '@/services/api/api-error';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

/** The address book: every saved address, with add, edit, delete and "make default". */
export function AddressesScreen() {
  const router = useRouter();
  const { addresses, isHydrated, error, reload, remove, setDefault } = useAddresses();
  const { state: auth, continueAsGuest, retrySession } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAddresses = async () => {
    setIsRefreshing(true);
    try { await reload(); } finally { setIsRefreshing(false); }
  };

  const changeAddress = async (operation: () => Promise<void>) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await operation();
    } catch (failure) {
      const apiError = toApiError(failure);
      Alert.alert('Address could not be updated', apiError.message);
    } finally {
      setIsBusy(false);
    }
  };

  const openEditor = (id: string) => router.push({ pathname: '/address/[id]', params: { id } });

  const confirmDelete = (address: SavedAddress) =>
    Alert.alert(
      `Delete the ${address.label} address?`,
      'Orders you have already placed are not affected.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void changeAddress(() => remove(address.id)) },
      ],
    );

  const isFull = addresses.length >= MAX_SAVED_ADDRESSES;

  if (auth.status === 'error') return <Screen edges={SCREEN_EDGES}><ErrorState error={auth.error} onRetry={retrySession} /></Screen>;

  if (auth.status === 'signedOut' && auth.reason === 'expired') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title: 'Saved Addresses' }} />
        <EmptyState icon="location" title="Sign in again" message="Your session ended. Sign in to access your account addresses."
          actionLabel="Sign in" onAction={() => router.push('/sign-in')} />
        <View style={styles.footer}><PrimaryButton title="Continue as guest" onPress={continueAsGuest} /></View>
      </Screen>
    );
  }

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Saved Addresses' }} />
      {!isHydrated ? (
        <LoadingState />
      ) : (
        <>
          <View style={styles.notice}>
            <AppText variant="caption" color="textSecondary">
              {auth.status === 'signedIn' ? 'Addresses saved to your account are available on your other devices.' : 'These addresses are saved on this device.'}
            </AppText>
            {error && addresses.length > 0 ? (
              <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">{error.message}</AppText>
            ) : null}
          </View>
          <FlatList
            data={addresses}
            refreshing={isRefreshing}
            onRefresh={() => void refreshAddresses()}
            keyExtractor={(address) => address.id}
            contentContainerStyle={styles.content}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            ListEmptyComponent={
              error ? <ErrorState error={error} onRetry={() => void reload()} /> : <EmptyState
                icon="location"
                title="No saved addresses"
                message="Save your delivery address once and pick it at checkout next time."
              />
            }
            renderItem={({ item }) => (
              <View pointerEvents={isBusy ? 'none' : 'auto'}>
                <AddressCard
                  address={item}
                  onEdit={() => openEditor(item.id)}
                  onDelete={() => confirmDelete(item)}
                  onMakeDefault={() => void changeAddress(() => setDefault(item.id))}
                />
              </View>
            )}
          />
          <View style={styles.footer}>
            {isFull ? (
              <AppText variant="caption" color="textSecondary" style={styles.note}>
                You can save up to {MAX_SAVED_ADDRESSES} addresses. Delete one to add another.
              </AppText>
            ) : null}
            <PrimaryButton
              title="Add new address"
              disabled={isFull || isBusy}
              onPress={() => openEditor('new')}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.three,
  },
  gap: {
    height: Spacing.three,
  },
  footer: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  note: {
    textAlign: 'center',
  },
  notice: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
});
