import { apiRequest } from '@/services/api/client';
import { asArray, asInteger, asNullableString, asObject, asString } from '@/services/api/parse';
import { NOTIFICATION_SCREENS, type NotificationScreen } from '@/features/notifications/notification-target';

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export type InboxNotification = {
  id: string;
  eventKey: string;
  title: string;
  body: string;
  imageUrl: string | null;
  /** Unknown values from a newer server fall back to the inbox itself. */
  targetScreen: NotificationScreen;
  targetParams: Record<string, string>;
  readAt: string | null;
  createdAt: string;
};

export type InboxPage = {
  items: InboxNotification[];
  unreadCount: number;
  page: number;
  totalPages: number;
};

function parseTargetParams(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const params: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') params[key] = entry;
  }
  return params;
}

function parseNotification(value: unknown): InboxNotification {
  const dto = asObject(value);
  const screen = asString(dto.targetScreen);
  return {
    id: asString(dto.id),
    eventKey: asString(dto.eventKey),
    title: asString(dto.title),
    body: asString(dto.body),
    imageUrl: asNullableString(dto.imageUrl),
    targetScreen: (NOTIFICATION_SCREENS as readonly string[]).includes(screen)
      ? (screen as NotificationScreen)
      : 'NOTIFICATIONS',
    targetParams: parseTargetParams(dto.targetParams),
    readAt: asNullableString(dto.readAt),
    createdAt: asString(dto.createdAt),
  };
}

export const registerPushDevice = (
  token: string,
  device: { installationId: string; token: string; platform: 'ANDROID' | 'IOS'; appVersion: string | null }
) => apiRequest('/account/devices', { method: 'PUT', headers: bearer(token), body: device, parse: () => undefined });

export const unregisterPushDevice = (token: string, installationId: string) =>
  apiRequest(`/account/devices/${encodeURIComponent(installationId)}`, {
    method: 'DELETE',
    headers: bearer(token),
    parse: () => undefined,
  });

export const fetchInbox = (token: string, page: number, signal?: AbortSignal) =>
  apiRequest(`/account/notifications?page=${page}&limit=20`, {
    headers: bearer(token),
    signal,
    parse: (data): InboxPage => {
      const dto = asObject(data);
      const pagination = asObject(dto.pagination);
      return {
        items: asArray(dto.items, parseNotification),
        unreadCount: asInteger(dto.unreadCount),
        page: asInteger(pagination.page),
        totalPages: asInteger(pagination.totalPages),
      };
    },
  });

export const fetchUnreadCount = (token: string, signal?: AbortSignal) =>
  apiRequest('/account/notifications/unread-count', {
    headers: bearer(token),
    signal,
    parse: (data) => asInteger(asObject(data).unreadCount),
  });

export const markNotificationRead = (token: string, id: string) =>
  apiRequest(`/account/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    headers: bearer(token),
    parse: parseNotification,
  });

export const markAllNotificationsRead = (token: string) =>
  apiRequest('/account/notifications/read-all', {
    method: 'POST',
    headers: bearer(token),
    parse: (data) => asInteger(asObject(data).updated),
  });
