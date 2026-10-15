import { useRootNavigationState, useRouter } from 'expo-router';
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import {
  isPushSupported,
  type PushPermission,
  readPermission,
  registerThisDevice,
  requestPermission,
  unregisterThisDevice,
} from '@/features/notifications/push-registration';
import { loadNotificationsModule } from '@/features/notifications/notifications-module';
import { parsePushPayload, type PushPayload, routeForNotification } from '@/features/notifications/notification-target';
import { toApiError } from '@/services/api/api-error';
import { fetchUnreadCount, markNotificationRead } from '@/services/api/notifications-api';

const Notifications = loadNotificationsModule();
// Fixed for the life of the app, so the hook order never changes between renders.
const useLastNotificationResponse = Notifications
  ? Notifications.useLastNotificationResponse
  : () => undefined;

if (Notifications && isPushSupported()) {
  // How a notification is shown while the app is open. Taps are handled below.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

type NotificationsValue = {
  unreadCount: number;
  permission: PushPermission;
  /** Asks the system for permission (once) and registers this phone when it is granted. */
  enablePush: () => Promise<PushPermission>;
  /** Re-reads the unread count from the server. */
  refreshUnread: () => void;
  /** Lets the inbox screen report a count it just received or changed. */
  setUnreadCount: (count: number) => void;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { state, expireSession } = useAuth();
  const router = useRouter();
  const navigationReady = Boolean(useRootNavigationState()?.key);
  const lastResponse = useLastNotificationResponse();

  // The count belongs to the sign-in it was read for, so a different account never sees it.
  const [unread, setUnread] = useState<{ owner: string; count: number } | null>(null);
  const [permission, setPermission] = useState<PushPermission>('unsupported');
  const handledResponses = useRef(new Set<string>());

  const token = state.status === 'signedIn' ? state.token : null;
  const unreadCount = token !== null && unread?.owner === token ? unread.count : 0;
  const setUnreadCount = useCallback(
    (count: number) => {
      if (token) setUnread({ owner: token, count });
    },
    [token]
  );

  const refreshUnread = useCallback(() => {
    if (!token) return;
    fetchUnreadCount(token).then(setUnreadCount, (error: unknown) => {
      if (toApiError(error).code === 'UNAUTHENTICATED') void expireSession(token);
    });
  }, [token, expireSession, setUnreadCount]);

  // Registration: a granted permission keeps this phone registered for the signed-in account;
  // a revoked one removes it, so a phone that stopped allowing notifications is not targeted.
  const syncRegistration = useEffectEvent(async (): Promise<PushPermission> => {
    const current = await readPermission();
    if (!token || current === 'unsupported') return current;
    if (current === 'granted') {
      await registerThisDevice(token);
    } else {
      await unregisterThisDevice(token);
    }
    return current;
  });

  useEffect(() => {
    void syncRegistration().then(setPermission);
    refreshUnread();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void syncRegistration().then(setPermission);
        refreshUnread();
      }
    });
    return () => subscription.remove();
  }, [token, refreshUnread]);

  const reregister = useEffectEvent((deviceToken: string) => {
    if (token) void registerThisDevice(token, deviceToken);
  });
  useEffect(() => {
    if (!Notifications || !isPushSupported()) return undefined;
    const tokenSubscription = Notifications.addPushTokenListener((next) => {
      if (typeof next.data === 'string') reregister(next.data);
    });
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => refreshUnread());
    return () => {
      tokenSubscription.remove();
      receivedSubscription.remove();
    };
  }, [refreshUnread]);

  const openTap = useEffectEvent(async (payload: PushPayload) => {
    if (!token) {
      // Not signed in (or a different person): the notification belongs to an account.
      router.push('/sign-in');
      return;
    }
    try {
      // The server confirms the notification belongs to THIS account and says where it goes.
      const item = await markNotificationRead(token, payload.notificationId);
      refreshUnread();
      router.push(routeForNotification(item.targetScreen, item.targetParams));
    } catch (error) {
      const code = toApiError(error).code;
      if (code === 'UNAUTHENTICATED') {
        await expireSession(token);
        router.push('/sign-in');
      } else if (code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
        // Offline: the destination screens load with this account's own sign-in anyway.
        router.push(routeForNotification(payload.screen, payload.params));
      } else {
        router.push('/notifications');
      }
    }
  });

  // A tap, whether the app was closed, in the background or open. Each response is handled
  // once, and only after navigation and the stored sign-in are ready.
  useEffect(() => {
    if (!lastResponse || !navigationReady || state.status === 'loading') return;
    const id = `${lastResponse.notification.request.identifier}:${lastResponse.actionIdentifier}`;
    if (handledResponses.current.has(id)) return;
    handledResponses.current.add(id);
    if (!Notifications || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const payload = parsePushPayload(lastResponse.notification.request.content.data);
    void Notifications?.clearLastNotificationResponseAsync();
    if (payload) void openTap(payload);
  }, [lastResponse, navigationReady, state.status]);

  const enablePush = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    if (result === 'granted' && token) await registerThisDevice(token);
    return result;
  }, [token]);

  const value = useMemo(
    () => ({ unreadCount, permission, enablePush, refreshUnread, setUnreadCount }),
    [unreadCount, permission, enablePush, refreshUnread, setUnreadCount]
  );

  return <NotificationsContext value={value}>{children}</NotificationsContext>;
}

export function useNotifications(): NotificationsValue {
  const value = use(NotificationsContext);
  if (!value) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return value;
}
