import { readJson, StorageKeys, writeJson } from '@/services/storage';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

/** What the customer picked. 'system' follows the phone's own light/dark setting. */
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** New installs, and anything unreadable in storage, start on the light theme. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'light';

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export async function loadThemePreference(): Promise<ThemePreference> {
  const result = await readJson(StorageKeys.themePreference);
  return result.ok && isThemePreference(result.value) ? result.value : DEFAULT_THEME_PREFERENCE;
}

export function saveThemePreference(preference: ThemePreference): Promise<boolean> {
  return writeJson(StorageKeys.themePreference, preference);
}
