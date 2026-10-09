import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { AccountCard } from '@/features/account/components/account-card';
import { ConnectionCheck } from '@/features/account/components/connection-check';
import { useAddresses } from '@/features/addresses/addresses-context';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { useTheme } from '@/hooks/use-theme';

const appVersion = Constants.expoConfig?.version;

type AccountRow = {
  key: string;
  /** An icon, or null to show the red heart. */
  icon: IconName | null;
  title: string;
  detail: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { count: wishlistCount } = useWishlist();
  const { addresses } = useAddresses();

  const rows: AccountRow[] = [
    {
      key: 'wishlist',
      icon: null,
      title: 'My Wishlist',
      detail: wishlistCount === 0 ? 'Nothing saved' : `${wishlistCount} saved`,
      accessibilityLabel: `My Wishlist, ${wishlistCount} saved`,
      onPress: () => router.push('/wishlist'),
    },
    {
      key: 'addresses',
      icon: 'location',
      title: 'Saved Addresses',
      detail: addresses.length === 0 ? 'None saved' : `${addresses.length} saved`,
      accessibilityLabel: `Saved Addresses, ${addresses.length} saved`,
      onPress: () => router.push('/addresses'),
    },
    {
      key: 'help',
      icon: 'help',
      title: 'Help & Support',
      detail: 'Contact the shop',
      accessibilityLabel: 'Help and Support',
      onPress: () => router.push('/help'),
    },
    {
      key: 'about',
      icon: 'info',
      title: 'About DoorKart',
      detail: appVersion ? `Version ${appVersion}` : 'Your local shop, online',
      accessibilityLabel: 'About DoorKart',
      onPress: () => router.push('/about'),
    },
  ];

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AccountCard />

        <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              accessibilityLabel={row.accessibilityLabel}
              onPress={row.onPress}
              style={({ pressed }) => [
                styles.option,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}>
              {row.icon ? (
                <Icon name={row.icon} size={24} color="primary" />
              ) : (
                <AppText style={[styles.heart, { color: theme.danger }]}>♥</AppText>
              )}
              <AppText style={styles.optionTitle}>{row.title}</AppText>
              <AppText variant="caption" color="textSecondary">
                {row.detail}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* A troubleshooting tool for whoever sets the app up, not something customers need. */}
        {__DEV__ ? <ConnectionCheck /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  list: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    minHeight: 56,
  },
  optionTitle: {
    flex: 1,
  },
  heart: {
    width: 24,
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
