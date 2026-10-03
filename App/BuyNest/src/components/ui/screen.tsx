import { StyleSheet, View } from 'react-native';
import { type Edge, SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';

import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DEFAULT_EDGES: Edge[] = ['top', 'left', 'right'];

/** Page wrapper: themed background, safe-area padding and a centered max width on wide screens. */
export function Screen({ style, edges = DEFAULT_EDGES, children, ...rest }: SafeAreaViewProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      {...rest}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
});
