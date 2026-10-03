import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AccountOption = {
  icon: IconName;
  title: string;
  detail: string;
};

const appVersion = Constants.expoConfig?.version;

// These are not tappable yet: each one needs customer login or a screen that does not exist.
const OPTIONS: AccountOption[] = [
  { icon: 'account', title: 'My Profile', detail: 'Coming soon' },
  { icon: 'location', title: 'Saved Addresses', detail: 'Coming soon' },
  { icon: 'help', title: 'Help & Support', detail: 'Coming soon' },
  {
    icon: 'info',
    title: 'About BuyNest',
    detail: appVersion ? `Version ${appVersion}` : 'Your local shop, online',
  },
];

export function AccountScreen() {
  const theme = useTheme();

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.guest, { backgroundColor: theme.primarySoft }]}>
          <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
            <Icon name="account" size={32} color="primary" />
          </View>
          <View style={styles.guestText}>
            <AppText variant="heading">Welcome to BuyNest</AppText>
            <AppText variant="caption" color="textSecondary">
              You are browsing as a guest. Customer login will be added later.
            </AppText>
          </View>
        </View>

        <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {OPTIONS.map((option, index) => (
            <View
              key={option.title}
              style={[
                styles.option,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
              ]}>
              <Icon name={option.icon} size={24} color="primary" />
              <AppText style={styles.optionTitle}>{option.title}</AppText>
              <AppText variant="caption" color="textSecondary">
                {option.detail}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  guest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    flex: 1,
    gap: Spacing.one,
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
});
