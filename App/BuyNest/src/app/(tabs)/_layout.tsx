import { Tabs } from 'expo-router/js-tabs';

import { Icon, type IconName } from '@/components/ui/icon';
import { useCart } from '@/features/cart/cart-context';
import { useTheme } from '@/hooks/use-theme';

function tabIcon(name: IconName) {
  function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return <Icon name={name} size={size} color={focused ? 'primary' : 'textSecondary'} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const theme = useTheme();
  const { itemCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarBadgeStyle: { backgroundColor: theme.accent, color: theme.textOnPrimary },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="categories"
        options={{ title: 'Categories', tabBarIcon: tabIcon('categories') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: tabIcon('cart'),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: tabIcon('orders') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: tabIcon('account') }} />
    </Tabs>
  );
}
