import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** The color tokens for the scheme the app is currently drawn in. */
export function useTheme() {
  return Colors[useColorScheme()];
}
