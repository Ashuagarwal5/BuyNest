import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { AccountCard } from '@/features/account/components/account-card';
import { ConnectionCheck } from '@/features/account/components/connection-check';
import { useWishlist } from '@/features/wishlist/wishlist-context';
import { useTheme } from '@/hooks/use-theme';

type AccountOption = {
  icon: IconName;
  title: string;
  detail: string;
};

const appVersion = Constants.expoConfig?.version;

// These are not tappable yet: each one needs customer login or a screen that does not exist.
const OPTIONS: AccountOption[] = [
  { icon: 'location', title: 'Saved Addresses', detail: 'Coming soon' },
  { icon: 'help', title: 'Help & Support', detail: 'Coming soon' },
  {
    icon: 'info',
    title: 'About DoorKart',
    detail: appVersion ? `Version ${appVersion}` : 'Your local shop, online',
  },
];

export function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { count: wishlistCount } = useWishlist();

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AccountCard />

        <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`My Wishlist, ${wishlistCount} saved`}
            onPress={() => router.push('/wishlist')}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <AppText style={[styles.heart, { color: theme.danger }]}>♥</AppText>
            <AppText style={styles.optionTitle}>My Wishlist</AppText>
            <AppText variant="caption" color="textSecondary">
              {wishlistCount === 0 ? 'Nothing saved' : `${wishlistCount} saved`}
            </AppText>
          </Pressable>

          {OPTIONS.map((option) => (
            <View
              key={option.title}
              style={[
                styles.option,
                { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
              ]}>
              <Icon name={option.icon} size={24} color="primary" />
              <AppText style={styles.optionTitle}>{option.title}</AppText>
              <AppText variant="caption" color="textSecondary">
                {option.detail}
              </AppText>
            </View>
          ))}
        </View>

        <ConnectionCheck />
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
