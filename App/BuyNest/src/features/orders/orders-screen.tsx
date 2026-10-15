import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { OrderCard } from '@/features/orders/components/order-card';
import { UnconfirmedOrderNotice } from '@/features/orders/components/unconfirmed-order-notice';
import { useOrders } from '@/features/orders/order-context';
import { useTheme } from '@/hooks/use-theme';

const SCREEN_EDGES = ['left', 'right'] as const;

export function OrdersScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const {
    index,
    visibleOrders,
    accountHistory,
    legacyLocalOrderCount,
    getDetail,
    reloadIndex,
    refreshAll,
    removeLegacyLocalOrders,
  } = useOrders();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // Order status changes at the shop, so fetch the latest whenever this tab is opened.
  const refresh = useEffectEvent(() => {
    if (index === 'ready') {
      refreshAll();
    }
  });
  useEffect(() => {
    refresh();
    // The tab stays mounted, so returning to it needs the focus event as well.
    return navigation.addListener('focus', () => refresh());
  }, [navigation, index]);

  if (index === 'loading') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <LoadingState />
      </Screen>
    );
  }

  const handlePullRefresh = async () => {
    setIsPullRefreshing(true);
    await refreshAll();
    setIsPullRefreshing(false);
  };

  return (
    <Screen edges={SCREEN_EDGES}>
      <FlatList
        data={visibleOrders}
        keyExtractor={(order) => order.orderNumber}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <UnconfirmedOrderNotice />
            <AppText variant="caption" color="textSecondary">
              {accountHistory.active
                ? 'Orders from your account and orders saved on this device.'
                : 'Orders saved on this device. Sign in to see purchases made with your account on other devices.'}
            </AppText>
            {!accountHistory.active && accountHistory.status !== 'loading' ? (
              <PrimaryButton title="Sign in" size="small" variant="secondary" onPress={() => router.push('/sign-in')} />
            ) : null}
            {accountHistory.status === 'loading' ? <LoadingState /> : null}
            {accountHistory.error ? (
              <View style={styles.header}>
                <AppText color="danger" accessibilityLiveRegion="polite">{accountHistory.error.message}</AppText>
                <PrimaryButton
                  title={accountHistory.error.code === 'UNAUTHENTICATED' ? 'Sign in again' : 'Retry account history'}
                  size="small" variant="secondary"
                  onPress={() => accountHistory.error?.code === 'UNAUTHENTICATED' ? router.push('/sign-in') : accountHistory.refresh()}
                />
              </View>
            ) : null}
            {index === 'error' ? (
              <EmptyState icon="orders" title="Could not read device orders"
                message="Orders saved on this device could not be read. Try again to load them."
                actionLabel="Retry device orders" onAction={reloadIndex} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          accountHistory.status === 'loading' || accountHistory.error ? null : <EmptyState
            icon="orders"
            title="No orders yet"
            message="Once you place an order, you'll see it here."
          />
        }
        ListFooterComponent={
          <View style={styles.header}>
            {accountHistory.hasMore ? (
              <PrimaryButton title="Load more account orders" size="small" variant="secondary"
                loading={accountHistory.loadingMore} onPress={accountHistory.loadMore} />
            ) : null}
            {legacyLocalOrderCount > 0 ? (
            <View style={[styles.legacy, { backgroundColor: theme.accentSoft }]}>
              <AppText variant="captionStrong">
                {legacyLocalOrderCount} earlier test{' '}
                {legacyLocalOrderCount === 1 ? 'order is' : 'orders are'} saved on this device
              </AppText>
              <AppText variant="caption" color="textSecondary">
                They were created before DoorKart went online and were never sent to the shop,
                so they are not shown above.
              </AppText>
              <PrimaryButton
                title="Remove them"
                size="small"
                variant="secondary"
                onPress={removeLegacyLocalOrders}
              />
            </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <OrderCard tracked={item} detail={getDetail(item.orderNumber)} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.three },
  content: {
    flexGrow: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  legacy: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
});
