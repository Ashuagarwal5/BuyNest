import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';

import {
  DEFAULT_THEME_PREFERENCE,
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/features/theme/theme-storage';

export type ColorScheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  /** The scheme actually on screen, after resolving 'system'. */
  colorScheme: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

// Keep the splash up until the saved theme is known, so a dark-theme customer never sees a
// light flash on launch. Reading it never throws, so the splash is always hidden below.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Tells native UI (alerts, keyboards, pickers) which scheme to draw. Without this, they follow
 * the phone even when the customer picked a fixed theme. Web has no equivalent.
 */
function applyNativeColorScheme(preference: ThemePreference) {
  if (typeof Appearance.setColorScheme === 'function') {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }
}

/** The customer's app theme. Saved on the phone; light until they choose otherwise. */
export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  // With a fixed theme applied natively this reports that theme, so it is only read for 'system',
  // which resets the native override first.
  const systemScheme = useSystemColorScheme();

  useEffect(() => {
    let isActive = true;
    loadThemePreference()
      .then((saved) => {
        if (isActive) {
          applyNativeColorScheme(saved);
          setPreferenceState(saved);
        }
      })
      .finally(() => {
        void SplashScreen.hideAsync().catch(() => undefined);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    applyNativeColorScheme(next);
    setPreferenceState(next);
    void saveThemePreference(next);
  }, []);

  const colorScheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({ preference, colorScheme, setPreference }),
    [preference, colorScheme, setPreference],
  );

  return <ThemePreferenceContext value={value}>{children}</ThemePreferenceContext>;
}

export function useThemePreference(): ThemePreferenceContextValue {
  const value = use(ThemePreferenceContext);
  if (!value) {
    throw new Error('useThemePreference must be used inside <ThemePreferenceProvider>');
  }
  return value;
}
