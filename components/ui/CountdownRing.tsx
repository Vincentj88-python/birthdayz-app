import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Body } from './Text';
import { colors, fonts, fontSize } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CountdownRingProps {
  daysUntil: number;
  maxDays?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function CountdownRing({
  daysUntil,
  maxDays = 30,
  size = 72,
  strokeWidth = 5,
  label,
}: CountdownRingProps) {
  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetProgress = Math.max(0, 1 - daysUntil / maxDays);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const isToday = daysUntil === 0;
  const ringColor = isToday ? colors.accent.red : colors.accent.gold;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Body style={[styles.days, isToday && styles.daysToday]}>
          {isToday ? '🎂' : daysUntil}
        </Body>
        {label && !isToday && (
          <Body style={styles.label}>{label}</Body>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  svg: {
    transform: [{ rotateZ: '0deg' }],
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xl,
    color: colors.accent.gold,
  },
  daysToday: {
    fontSize: 28,
  },
  label: {
    fontFamily: fonts.body.medium,
    fontSize: 10,
    color: colors.text.muted,
    marginTop: -2,
  },
});
