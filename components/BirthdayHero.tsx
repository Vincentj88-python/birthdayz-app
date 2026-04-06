import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Heading, Body } from '@/components/ui';
import { colors, fonts, spacing, borderRadius, fontSize } from '@/constants/theme';
import { getAgeTurning } from '@/lib/birthday';
import type { Friend } from '@/types/database';

interface BirthdayHeroProps {
  friends: Friend[];
  onSendWish: (friend: Friend) => void;
}

export function BirthdayHero({ friends, onSendWish }: BirthdayHeroProps) {
  const { t } = useTranslation();

  if (friends.length === 1) {
    const friend = friends[0];
    const age = getAgeTurning(friend.birthday!);

    return (
      <View style={styles.heroCard}>
        <Body style={styles.emoji}>🎂</Body>
        <Heading style={styles.heroName}>{friend.name}</Heading>
        <Body style={styles.heroAge}>
          {age > 0
            ? t('home.turnsToday', { name: friend.name, age })
            : `${friend.name}'s birthday is today!`}
        </Body>
        <TouchableOpacity style={styles.wishBtn} onPress={() => onSendWish(friend)} activeOpacity={0.8}>
          <Body style={styles.wishBtnText}>{t('home.sendWish')}</Body>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {friends.map((friend) => {
        const age = getAgeTurning(friend.birthday!);
        return (
          <View key={friend.id} style={styles.miniCard}>
            <Body style={styles.miniEmoji}>🎂</Body>
            <Body style={styles.miniName}>{friend.name}</Body>
            {age > 0 && <Body style={styles.miniAge}>{t('friend.turnsAge', { age })}</Body>}
            <TouchableOpacity style={styles.miniWishBtn} onPress={() => onSendWish(friend)} activeOpacity={0.8}>
              <Body style={styles.miniWishText}>{t('home.sendWish')}</Body>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.accent.red,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
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
  },
  wishBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  wishBtnText: {
    color: colors.accent.red,
    fontFamily: fonts.body.bold,
    fontSize: fontSize.md,
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
  miniEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  miniName: {
    color: colors.white,
    fontFamily: fonts.body.bold,
    fontSize: fontSize.md,
    textAlign: 'center',
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
