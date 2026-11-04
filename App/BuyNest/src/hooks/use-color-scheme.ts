import { type ColorScheme, useThemePreference } from '@/features/theme/theme-context';

/** The scheme the app is drawn in: the customer's chosen theme, or the phone's for 'system'. */
export function useColorScheme(): ColorScheme {
  return useThemePreference().colorScheme;
}
