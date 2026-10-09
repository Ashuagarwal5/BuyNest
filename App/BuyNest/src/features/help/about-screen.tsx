import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchShopInfo } from '@/services/api/catalog-api';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;
const appVersion = Constants.expoConfig?.version;

/** The app's name and version, and the links Google Play expects: privacy policy and terms. */
export function AboutScreen() {
  const theme = useTheme();
  // The links are a bonus: if they cannot be loaded the rest of the screen still shows.
  const shop = useApiData('shop-info', (signal) => fetchShopInfo(signal));
  const links =
    shop.status === 'success'
      ? [
          { label: 'Privacy Policy', url: shop.data.privacyPolicyUrl },
          { label: 'Terms of Service', url: shop.data.termsUrl },
        ].flatMap((link) => (link.url ? [{ label: link.label, url: link.url }] : []))
      : [];

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open', 'This phone could not open the link.');
    }
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'About DoorKart' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <AppText variant="title" color="primary" accessibilityRole="header">
            DoorKart
          </AppText>
          <AppText color="textSecondary" style={styles.centered}>
            Your local shop, delivered to your door.
          </AppText>
          {appVersion ? (
            <AppText variant="caption" color="textSecondary">
              Version {appVersion}
            </AppText>
          ) : null}
        </View>

        <AppText color="textSecondary" style={styles.centered}>
          Stationery, gifts, toys, sports and decoration items from a shop near you, with Cash on
          Delivery.
        </AppText>

        {links.length > 0 ? (
          <View
            style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {links.map((link, index) => (
              <Pressable
                key={link.label}
                accessibilityRole="link"
                onPress={() => openLink(link.url)}
                style={({ pressed }) => [
                  styles.link,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <AppText>{link.label}</AppText>
                <AppText color="primary">Open</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: Radius.large,
  },
  centered: {
    textAlign: 'center',
  },
  list: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.6,
  },
});
