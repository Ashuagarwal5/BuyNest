import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Confetti, type ConfettiOrigin } from '@/components/ui/confetti';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** How long the celebration stays before revealing the order summary underneath. */
const CELEBRATION_MS = 2600;

type OrderCelebrationProps = {
  customerName: string;
  /** Called once it should go away: after its time is up, or when the customer taps it. */
  onDone: () => void;
};

/**
 * A full-screen "order placed" moment: the message in the middle of the screen with a
 * party-popper burst around it. Render it over the order summary and unmount it on `onDone`.
 */
export function OrderCelebration({ customerName, onDone }: OrderCelebrationProps) {
  const theme = useTheme();
  const [burstOrigin, setBurstOrigin] = useState<ConfettiOrigin | null>(null);

  useEffect(() => {
    const timer = setTimeout(onDone, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Animated.View
      exiting={FadeOut.duration(300)}
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Order placed successfully. Thank you, ${customerName}. Tap to see your order.`}
        onPress={onDone}
        style={styles.fill}>
        <View
          style={styles.message}
          onLayout={({ nativeEvent: { layout } }) =>
            setBurstOrigin({ x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 })
          }>
          <Animated.View
            entering={ZoomIn.springify().damping(9)}
            style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
            <Icon name="success" size={56} color="primary" />
          </Animated.View>
          <AppText variant="title" style={styles.centerText}>
            Order Placed Successfully
          </AppText>
          <AppText color="textSecondary" style={styles.centerText}>
            Thank you, {customerName}!
          </AppText>
        </View>
      </Pressable>
      {/* Waits for the message to be laid out so the burst goes off around it. */}
      {burstOrigin ? <Confetti origin={burstOrigin} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  message: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    width: 104,
    height: 104,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
});
