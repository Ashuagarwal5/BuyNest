import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PIECE_COUNT = 90;
// The strong brand colors only: the soft ones disappear against the light background.
const PIECE_COLORS: ThemeColor[] = ['primary', 'accent', 'success', 'danger'];
/** How far gravity pulls a piece down over its whole flight, in px. */
const GRAVITY = 260;

export type ConfettiOrigin = { x: number; y: number };

type Piece = {
  color: ThemeColor;
  /** Direction of travel, in radians. */
  angle: number;
  /** How far the blast throws it before air drag stops it, in px. */
  distance: number;
  width: number;
  height: number;
  isRound: boolean;
  /** Full turns over the flight. */
  spins: number;
  delay: number;
  duration: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createPieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, index) => {
    const isRound = index % 4 === 0;
    const size = randomBetween(6, 10);
    return {
      color: PIECE_COLORS[index % PIECE_COLORS.length],
      angle: Math.random() * Math.PI * 2,
      // Skewed so a few pieces fly far while most stay near the origin, like a real popper.
      distance: 60 + Math.random() ** 0.6 * 200,
      width: size,
      height: isRound ? size : size * randomBetween(1.4, 2),
      isRound,
      spins: randomBetween(1, 3) * (Math.random() < 0.5 ? -1 : 1),
      delay: randomBetween(0, 120),
      duration: randomBetween(1600, 2400),
    };
  });
}

type ConfettiPieceProps = {
  piece: Piece;
  origin: ConfettiOrigin;
};

function ConfettiPiece({ piece, origin }: ConfettiPieceProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    // .set()/.get() rather than .value: the React Compiler is on for this project.
    progress.set(withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.linear }),
    ));
  }, [progress, piece.delay, piece.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    // A fast blast that air drag slows quickly, while gravity keeps pulling it down.
    const blast = 1 - (1 - p) ** 3;
    return {
      opacity: p === 0 ? 0 : p > 0.7 ? (1 - p) / 0.3 : 1,
      transform: [
        { translateX: Math.cos(piece.angle) * piece.distance * blast },
        { translateY: Math.sin(piece.angle) * piece.distance * blast + GRAVITY * p * p },
        { scale: p < 0.08 ? p / 0.08 : 1 },
        { rotate: `${piece.spins * 360 * p}deg` },
        { rotateX: `${p * 540}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: origin.x - piece.width / 2,
          top: origin.y - piece.height / 2,
          width: piece.width,
          height: piece.height,
          borderRadius: piece.isRound ? piece.width / 2 : 2,
          backgroundColor: theme[piece.color],
        },
        animatedStyle,
      ]}
    />
  );
}

type ConfettiProps = {
  /** Where the burst goes off, in the coordinates of the parent this fills. */
  origin: ConfettiOrigin;
};

/**
 * A one-off party-popper burst: confetti blasts out from `origin` in every direction, then
 * drifts down and fades. It never takes touches, and it is skipped entirely when the device
 * asks for reduced motion.
 */
export function Confetti({ origin }: ConfettiProps) {
  const reduceMotion = useReducedMotion();
  // Made once per mount, so a re-render does not reshuffle pieces mid-flight.
  const [pieces] = useState(createPieces);

  if (reduceMotion) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((piece, index) => (
        <ConfettiPiece key={index} piece={piece} origin={origin} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
