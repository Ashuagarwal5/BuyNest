import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

type Module = typeof NotificationsModule;

let loaded: Module | null | undefined;

/**
 * `expo-notifications` needs native code. Expo Go and development builds made before it was
 * added do not contain it, and importing it there throws. Loading it lazily lets the app run
 * everywhere; push is simply unavailable (null) where the native module is missing.
 */
export function loadNotificationsModule(): Module | null {
  if (loaded === undefined) {
    // Only Android is supported; on web (and iOS for now) the module is never touched.
    if (Platform.OS !== 'android') {
      loaded = null;
      return loaded;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('expo-notifications') as Module;
    } catch {
      loaded = null;
    }
  }
  return loaded;
}
