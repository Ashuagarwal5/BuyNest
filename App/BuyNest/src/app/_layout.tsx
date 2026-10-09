import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AddressesProvider } from '@/features/addresses/addresses-context';
import { AuthProvider } from '@/features/auth/auth-context';
import { CartProvider } from '@/features/cart/cart-context';
import { OrdersProvider } from '@/features/orders/order-context';
import { WishlistProvider } from '@/features/wishlist/wishlist-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Opening a product or category link directly still puts the tabs underneath it.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <AuthProvider>
      <CartProvider>
        <OrdersProvider>
          <WishlistProvider>
            <AddressesProvider>
              <ThemeProvider value={navigationTheme}>
                <Stack
                  screenOptions={{
                    headerTintColor: theme.primary,
                    headerBackTitle: 'Back',
                  }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="search" options={{ title: 'Search' }} />
                  <Stack.Screen name="category/[slug]" options={{ title: 'Category' }} />
                  <Stack.Screen name="collection/[kind]" options={{ title: 'Products' }} />
                  <Stack.Screen name="product/[id]" options={{ title: '' }} />
                  <Stack.Screen name="checkout/index" options={{ title: 'Checkout' }} />
                  <Stack.Screen
                    name="order-success/[id]"
                    // No way back: the checkout form it came from has already been replaced.
                    options={{
                      title: 'Order Placed',
                      headerBackVisible: false,
                      headerLeft: () => null,
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
                  <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
                  <Stack.Screen name="wishlist" options={{ title: 'My Wishlist' }} />
                  <Stack.Screen name="addresses" options={{ title: 'Saved Addresses' }} />
                  <Stack.Screen name="help" options={{ title: 'Help & Support' }} />
                  <Stack.Screen name="about" options={{ title: 'About DoorKart' }} />
                  <Stack.Screen name="address/[id]" options={{ title: 'Address' }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </AddressesProvider>
          </WishlistProvider>
        </OrdersProvider>
      </CartProvider>
    </AuthProvider>
  );
}
