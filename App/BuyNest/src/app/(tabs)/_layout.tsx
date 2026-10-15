import { Tabs } from 'expo-router/js-tabs';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { MinTouchTarget } from '@/constants/theme';
import { useCart } from '@/features/cart/cart-context';
import { useNotifications } from '@/features/notifications/notifications-context';
import { useTheme } from '@/hooks/use-theme';

function tabIcon(name: IconName) {
  function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return <Icon name={name} size={size} color={focused ? 'primary' : 'textSecondary'} />;
  }
  return TabIcon;
}

function BrowseBackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
      style={{ minWidth: MinTouchTarget, minHeight: MinTouchTarget, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="back" size={24} color="primary" />
    </Pressable>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerTintColor: theme.primary,
        headerStyle: { backgroundColor: theme.surface },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.textOnPrimary },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: tabIcon('store') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: tabIcon('cart'),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: tabIcon('orders') }} />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: tabIcon('account'), tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tabs.Screen name="category/[slug]" options={{ href: null, title: 'Category', headerLeft: BrowseBackButton }} />
      <Tabs.Screen name="collection/[kind]" options={{ href: null, title: 'Products', headerLeft: BrowseBackButton }} />
    </Tabs>
  );
}
