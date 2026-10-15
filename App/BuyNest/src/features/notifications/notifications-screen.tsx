import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { routeForNotification } from '@/features/notifications/notification-target';
import { useNotifications } from '@/features/notifications/notifications-context';
import { useTheme } from '@/hooks/use-theme';
import { type ApiError, toApiError } from '@/services/api/api-error';
import {
  fetchInbox,
  type InboxNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/api/notifications-api';
import { formatDateTime } from '@/utils/date';

const SCREEN_EDGES = ['left', 'right'] as const;

type View_ =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; items: InboxNotification[]; page: number; totalPages: number };

export function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { state } = useAuth();
  const { unreadCount, permission, enablePush, setUnreadCount } = useNotifications();
  const token = state.status === 'signedIn' ? state.token : null;

  const [view, setView] = useState<View_>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const latest = useRef(0);

  const load = useCallback(
    async (page: number, mode: 'initial' | 'refresh' | 'more') => {
      if (!token) return;
      const id = ++latest.current;
      try {
        const result = await fetchInbox(token, page);
        if (id !== latest.current) return;
        setUnreadCount(result.unreadCount);
        setView((old) => ({
          status: 'ready',
          page: result.page,
          totalPages: result.totalPages,
          items:
            mode === 'more' && old.status === 'ready'
              ? [...old.items, ...result.items.filter((item) => !old.items.some((known) => known.id === item.id))]
              : result.items,
        }));
      } catch (error) {
        if (id !== latest.current) return;
        // A failed refresh or page keeps what is on screen.
        setView((old) => (mode === 'initial' || old.status !== 'ready' ? { status: 'error', error: toApiError(error) } : old));
        if (mode !== 'initial') setActionError(toApiError(error).message);
      }
    },
    [token, setUnreadCount]
  );

  useEffect(() => {
    setView({ status: 'loading' });
    void load(1, 'initial');
  }, [load]);

  if (state.status === 'loading') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <LoadingState />
      </Screen>
    );
  }
  if (!token) {
    return (
      <Screen edges={SCREEN_EDGES}>
        <EmptyState
          icon="bell"
          title="Sign in to see notifications"
          message="Order updates and shop messages for your account appear here."
          actionLabel="Sign in"
          onAction={() => router.push('/sign-in')}
        />
      </Screen>
    );
  }
  if (view.status === 'loading') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <LoadingState />
      </Screen>
    );
  }
  if (view.status === 'error') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <ErrorState error={view.error} onRetry={() => { setView({ status: 'loading' }); void load(1, 'initial'); }} />
      </Screen>
    );
  }

  const markAll = async () => {
    setActionError(null);
    try {
      await markAllNotificationsRead(token);
      setUnreadCount(0);
      const now = new Date().toISOString();
      setView((old) => (old.status === 'ready' ? { ...old, items: old.items.map((item) => ({ ...item, readAt: item.readAt ?? now })) } : old));
    } catch (error) {
      setActionError(toApiError(error).message);
    }
  };

  const open = async (item: InboxNotification) => {
    setActionError(null);
    try {
      // Confirms ownership on the server and returns where this notification leads.
      const confirmed = await markNotificationRead(token, item.id);
      if (!item.readAt) setUnreadCount(Math.max(0, unreadCount - 1));
      setView((old) =>
        old.status === 'ready'
          ? { ...old, items: old.items.map((entry) => (entry.id === item.id ? { ...entry, readAt: confirmed.readAt } : entry)) }
          : old
      );
      router.push(routeForNotification(confirmed.targetScreen, confirmed.targetParams));
    } catch (error) {
      setActionError(toApiError(error).message);
    }
  };

  const header = (
    <View style={styles.header}>
      {permission === 'undetermined' || permission === 'denied' ? (
        <View style={[styles.banner, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
          <AppText variant="bodyStrong">Get order updates on this phone</AppText>
          <AppText variant="caption" color="textSecondary">
            {permission === 'denied'
              ? 'Notifications are turned off for DoorKart. You can still read every update here.'
              : 'Allow notifications to hear about your orders right away. Updates always appear here too.'}
          </AppText>
          <PrimaryButton
            title={permission === 'denied' ? 'Open phone settings' : 'Turn on notifications'}
            size="small"
            variant="secondary"
            onPress={() => (permission === 'denied' ? void Linking.openSettings() : void enablePush())}
          />
        </View>
      ) : null}
      {actionError ? <AppText variant="caption" color="danger">{actionError}</AppText> : null}
      {unreadCount > 0 ? (
        <PrimaryButton title={`Mark all as read (${unreadCount})`} size="small" variant="secondary" onPress={markAll} />
      ) : null}
    </View>
  );

  return (
    <Screen edges={SCREEN_EDGES}>
      <FlatList
        data={view.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState icon="bell" title="No notifications yet" message="Updates about your orders and reviews will appear here." />
        }
        ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footer} /> : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await load(1, 'refresh');
              setIsRefreshing(false);
            }}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={async () => {
          if (isLoadingMore || view.page >= view.totalPages) return;
          setIsLoadingMore(true);
          await load(view.page + 1, 'more');
          setIsLoadingMore(false);
        }}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.readAt ? '' : 'Unread. '}${item.title}. ${item.body}`}
            onPress={() => void open(item)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.dot, { backgroundColor: item.readAt ? 'transparent' : theme.primary }]} />
            <View style={styles.rowText}>
              <AppText variant={item.readAt ? 'body' : 'bodyStrong'}>{item.title}</AppText>
              <AppText variant="body" color="textSecondary">{item.body}</AppText>
              <AppText variant="caption" color="textSecondary">{formatDateTime(item.createdAt)}</AppText>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.two },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  banner: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  pressed: { opacity: 0.85 },
  rowText: { flex: 1, gap: Spacing.one },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  footer: { paddingVertical: Spacing.three },
});
