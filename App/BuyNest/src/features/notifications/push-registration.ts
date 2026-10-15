import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { loadNotificationsModule } from '@/features/notifications/notifications-module';
import { registerPushDevice, unregisterPushDevice } from '@/services/api/notifications-api';
import { readJson, StorageKeys, writeJson } from '@/services/storage';

/**
 * Device-side push plumbing, with no React in it. Android only: remote push needs a
 * development or production build (Expo Go cannot receive it), and iOS needs APNs and the
 * Firebase iOS SDK, which this app does not ship yet. Everything here is a quiet no-op
 * where push is not possible, so the inbox keeps working without it.
 */

export type PushPermission = 'unsupported' | 'undetermined' | 'granted' | 'denied';

const ANDROID_CHANNEL = 'default';

export function isPushSupported(): boolean {
  return (
    Platform.OS === 'android' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    loadNotificationsModule() !== null
  );
}

let channelReady = false;
async function ensureChannel(): Promise<void> {
  const Notifications = loadNotificationsModule();
  if (channelReady || !Notifications) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Orders and updates',
    importance: Notifications.AndroidImportance.HIGH,
  });
  channelReady = true;
}

export async function readPermission(): Promise<PushPermission> {
  if (!isPushSupported()) return 'unsupported';
  try {
    const result = await loadNotificationsModule()!.getPermissionsAsync();
    if (result.granted) return 'granted';
    return result.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** Shows the system permission prompt (Android 13+). Resolves with the resulting state. */
export async function requestPermission(): Promise<PushPermission> {
  if (!isPushSupported()) return 'unsupported';
  try {
    // On Android 13+ the prompt only appears once a channel exists.
    await ensureChannel();
    const result = await loadNotificationsModule()!.requestPermissionsAsync();
    if (result.granted) return 'granted';
    return result.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

function randomId(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `inst-${Date.now().toString(36)}-${part()}${part()}`;
}

let cachedInstallationId: string | null = null;

/** A random id created once per install. It names this phone to the server, never a person. */
export async function getInstallationId(): Promise<string> {
  if (cachedInstallationId) return cachedInstallationId;
  const stored = await readJson(StorageKeys.installationId);
  if (stored.ok && typeof stored.value === 'string' && /^[A-Za-z0-9._-]{16,100}$/.test(stored.value)) {
    cachedInstallationId = stored.value;
    return stored.value;
  }
  const created = randomId();
  cachedInstallationId = created;
  await writeJson(StorageKeys.installationId, created);
  return created;
}

/** Returns the FCM registration token, or null when this build or phone cannot provide one. */
export async function readDeviceToken(): Promise<string | null> {
  if (!isPushSupported()) return null;
  try {
    await ensureChannel();
    const token = await loadNotificationsModule()!.getDevicePushTokenAsync();
    return typeof token.data === 'string' && token.data.length >= 20 ? token.data : null;
  } catch {
    // Missing Firebase configuration in the build, or no Google services on the phone.
    return null;
  }
}

/** Sends the current token to the server for the signed-in account. Never throws. */
export async function registerThisDevice(accountToken: string, deviceToken?: string): Promise<boolean> {
  try {
    const token = deviceToken ?? (await readDeviceToken());
    if (!token) return false;
    await registerPushDevice(accountToken, {
      installationId: await getInstallationId(),
      token,
      platform: 'ANDROID',
      appVersion: Constants.expoConfig?.version ?? null,
    });
    return true;
  } catch {
    return false;
  }
}

/** Stops this phone receiving the account's notifications. Best effort; never throws. */
export async function unregisterThisDevice(accountToken: string): Promise<void> {
  try {
    await unregisterPushDevice(accountToken, await getInstallationId());
  } catch {
    // The server also moves the registration if another account signs in on this phone.
  }
}
