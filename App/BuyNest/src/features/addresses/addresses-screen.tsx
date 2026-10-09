import { Stack, useRouter } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { MAX_SAVED_ADDRESSES, type SavedAddress } from '@/features/addresses/address-types';
import { useAddresses } from '@/features/addresses/addresses-context';
import { AddressCard } from '@/features/addresses/components/address-card';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

/** The address book: every saved address, with add, edit, delete and "make default". */
export function AddressesScreen() {
  const router = useRouter();
  const { addresses, isHydrated, remove, setDefault } = useAddresses();

  const openEditor = (id: string) => router.push({ pathname: '/address/[id]', params: { id } });

  const confirmDelete = (address: SavedAddress) =>
    Alert.alert(
      `Delete the ${address.label} address?`,
      'Orders you have already placed are not affected.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(address.id) },
      ],
    );

  const isFull = addresses.length >= MAX_SAVED_ADDRESSES;

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Saved Addresses' }} />
      {!isHydrated ? (
        <LoadingState />
      ) : (
        <>
          <FlatList
            data={addresses}
            keyExtractor={(address) => address.id}
            contentContainerStyle={styles.content}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            ListEmptyComponent={
              <EmptyState
                icon="location"
                title="No saved addresses"
                message="Save your delivery address once and pick it at checkout next time."
              />
            }
            renderItem={({ item }) => (
              <AddressCard
                address={item}
                onEdit={() => openEditor(item.id)}
                onDelete={() => confirmDelete(item)}
                onMakeDefault={() => setDefault(item.id)}
              />
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
              disabled={isFull}
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
});
