import { Text, type TextProps } from 'react-native';

import { type ThemeColor, Typography, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ThemeColor;
};

export function AppText({ style, variant = 'body', color = 'text', ...rest }: AppTextProps) {
  const theme = useTheme();

  return <Text style={[Typography[variant], { color: theme[color] }, style]} {...rest} />;
}
