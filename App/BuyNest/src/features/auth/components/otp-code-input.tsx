import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const OTP_LENGTH = 6;

type OtpCodeInputProps = {
  value: string;
  /** Receives digits only, at most OTP_LENGTH of them. */
  onChange: (digits: string) => void;
  hasError?: boolean;
  editable?: boolean;
};

/**
 * One box per digit. A single real text field sits on top of the boxes, so typing, pasting and
 * the phone's one-time-code autofill all behave like a normal input.
 */
export function OtpCodeInput({ value, onChange, hasError = false, editable = true }: OtpCodeInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.boxes} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const isActive = isFocused && editable && index === activeIndex;
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: theme.background,
                  borderColor: hasError ? theme.danger : isActive ? theme.primary : theme.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}>
              <AppText variant="heading">{value[index] ?? ''}</AppText>
            </View>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel={`${OTP_LENGTH}-digit code`}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={OTP_LENGTH}
        editable={editable}
        autoFocus
        caretHidden
        style={styles.hiddenInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  boxes: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 64,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.01,
    color: 'transparent',
  },
});
