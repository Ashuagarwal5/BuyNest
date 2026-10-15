import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { AccountCard } from '@/features/account/components/account-card';
import { ConnectionCheck } from '@/features/account/components/connection-check';
import { useAddresses } from '@/features/addresses/addresses-context';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notifications-context';
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
  const { state } = useAuth();
  const { unreadCount } = useNotifications();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const rows: AccountRow[] = [
    { key: 'orders', icon: 'orders', title: 'My Orders', detail: 'Track purchases and deliveries', accessibilityLabel: 'My orders', onPress: () => router.navigate('/orders') },
    { key: 'reviews', icon: 'star', title: 'My Reviews', detail: 'Ratings & feedback', accessibilityLabel: 'My reviews', onPress: () => router.push('/my-reviews') },
    {
      key: 'notifications',
      icon: 'bell',
      title: 'Notifications',
      detail: unreadCount > 0 ? `${unreadCount} unread` : 'Order updates and messages',
      accessibilityLabel: `Notifications, ${unreadCount} unread`,
      onPress: () => router.push('/notifications'),
    },
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
    ...(state.status === 'signedIn' ? [{ key: 'settings', icon: 'account' as const, title: 'Account settings', detail: 'Sign-in methods, sign out and deletion', accessibilityLabel: 'Account settings', onPress: () => router.push('/account-settings') }] : []),
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

        {[
          { title: 'Your shopping', rows: rows.filter(row => ['orders', 'reviews', 'wishlist', 'addresses'].includes(row.key)) },
          { title: 'Support & settings', rows: rows.filter(row => ['help', 'about', 'settings'].includes(row.key)) },
        ].map(group => <View key={group.title} style={styles.group}>
          <AppText variant="captionStrong" color="textSecondary" style={styles.groupTitle}>{group.title}</AppText>
          <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {group.rows.map((row, index) => (
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
              <View style={styles.optionTitle}>
                <AppText variant="bodyStrong">{row.title}</AppText>
                <AppText variant="caption" color="textSecondary">{row.detail}</AppText>
              </View>
              <Icon name="chevron" size={20} color="textSecondary" />
            </Pressable>
          ))}
          </View>
        </View>)}

        {/* A troubleshooting tool for whoever sets the app up, not something customers need. */}
        {__DEV__ ? <View style={styles.group}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDiagnostics }}
            onPress={() => setShowDiagnostics(current => !current)} style={styles.option}>
            <AppText variant="caption" color="textSecondary">{showDiagnostics ? 'Hide developer diagnostics' : 'Developer diagnostics'}</AppText>
          </Pressable>
          {showDiagnostics ? <ConnectionCheck /> : null}
        </View> : null}
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
    overflow: 'hidden',
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
    gap: Spacing.one,
  },
  group: { gap: Spacing.two },
  groupTitle: { paddingHorizontal: Spacing.one },
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
