import { useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { AnimatedPressable, FadeIn, Heading, Body } from '@/components/ui';
import { colors, fonts, spacing, borderRadius, fontSize } from '@/constants/theme';
import { getAgeTurning } from '@/lib/birthday';
import type { Friend } from '@/types/database';

interface BirthdayHeroProps {
  friends: Friend[];
  onSendWish: (friend: Friend) => void;
}

function CelebrationEmoji() {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 600, easing: Easing.in(Easing.cubic) })
      ),
      -1,
      true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 400 }),
        withTiming(-8, { duration: 400 }),
        withTiming(0, { duration: 300 })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Body style={styles.emoji}>🎂</Body>
    </Animated.View>
  );
}

function PulsingDot({ delay: d }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function BirthdayHero({ friends, onSendWish }: BirthdayHeroProps) {
  const { t } = useTranslation();

  if (friends.length === 1) {
    const friend = friends[0];
    const age = getAgeTurning(friend.birthday!);

    return (
      <FadeIn duration={500}>
        <View style={styles.heroCard}>
          <View style={styles.dotsRow}>
            <PulsingDot delay={0} />
            <PulsingDot delay={200} />
            <PulsingDot delay={400} />
          </View>

          <CelebrationEmoji />

          <Heading style={styles.heroName}>{friend.name}</Heading>
          <Body style={styles.heroAge}>
            {age > 0
              ? t('home.turnsToday', { name: friend.name, age })
              : `${friend.name}'s birthday is today!`}
          </Body>

          <AnimatedPressable
            onPress={() => onSendWish(friend)}
            style={styles.wishBtn}
            scaleDown={0.95}
          >
            <Body style={styles.wishBtnText}>{t('home.sendWish')} 🎉</Body>
          </AnimatedPressable>
        </View>
      </FadeIn>
    );
  }

  return (
    <FadeIn duration={500}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {friends.map((friend, index) => {
          const age = getAgeTurning(friend.birthday!);
          return (
            <FadeIn key={friend.id} delay={index * 100} slideFrom={10}>
              <View style={styles.miniCard}>
                <CelebrationEmoji />
                <Body style={styles.miniName}>{friend.name}</Body>
                {age > 0 && <Body style={styles.miniAge}>{t('friend.turnsAge', { age })}</Body>}
                <AnimatedPressable
                  onPress={() => onSendWish(friend)}
                  style={styles.miniWishBtn}
                  scaleDown={0.95}
                >
                  <Body style={styles.miniWishText}>{t('home.sendWish')}</Body>
                </AnimatedPressable>
              </View>
            </FadeIn>
          );
        })}
      </ScrollView>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.accent.red,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  emoji: {
    fontSize: 56,
    lineHeight: 70,
    marginBottom: spacing.sm,
  },
  heroName: {
    color: colors.white,
    fontSize: fontSize.xxl,
    textAlign: 'center',
  },
  heroAge: {
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: fontSize.md,
  },
  wishBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  wishBtnText: {
    color: colors.accent.red,
    fontFamily: fonts.body.bold,
    fontSize: fontSize.lg,
  },
  scroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  miniCard: {
    backgroundColor: colors.accent.red,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    width: 180,
    marginRight: spacing.md,
  },
  miniName: {
    color: colors.white,
    fontFamily: fonts.body.bold,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  miniAge: {
    color: colors.white,
    opacity: 0.8,
    fontSize: fontSize.sm,
  },
  miniWishBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  miniWishText: {
    color: colors.accent.red,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
  },
});
