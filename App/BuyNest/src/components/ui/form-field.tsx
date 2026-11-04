import type { Ref } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MinTouchTarget, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
  /** Fixed text inside the box before what the customer types, such as a country code. */
  prefix?: string;
  /** Guidance under the field, replaced by `error` when there is one. */
  hint?: string;
  ref?: Ref<TextInput>;
};

export function FormField({ label, error, optional = false, prefix, hint, style, ref, ...inputProps }: FormFieldProps) {
  const theme = useTheme();
  const boxColors = {
    backgroundColor: theme.background,
    borderColor: error ? theme.danger : theme.border,
  };

  const input = (
    <TextInput
      ref={ref}
      accessibilityLabel={prefix ? `${label}, ${prefix}` : label}
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        { color: theme.text },
        prefix ? styles.prefixedInput : [styles.box, boxColors],
        style,
      ]}
      {...inputProps}
    />
  );

  return (
    <View style={styles.container}>
      <AppText variant="captionStrong">
        {label}
        {optional ? (
          <AppText variant="caption" color="textSecondary">
            {' '}
            (optional)
          </AppText>
        ) : null}
      </AppText>
      {prefix ? (
        <View style={[styles.box, styles.prefixRow, boxColors]}>
          <AppText color="textSecondary" style={[styles.prefix, { borderColor: theme.border }]}>
            {prefix}
          </AppText>
          {input}
        </View>
      ) : (
        input
      )}
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  box: {
    minHeight: MinTouchTarget,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  input: {
    ...Typography.body,
    // A fixed line height misaligns single-line input text on Android.
    lineHeight: undefined,
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: Spacing.three,
    borderRightWidth: 1,
  },
  prefixedInput: {
    flex: 1,
  },
});
