import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedPressable, Body, Muted, CountdownRing } from '@/components/ui';
import { colors, fonts, spacing, borderRadius, fontSize } from '@/constants/theme';
import { formatBirthdayDisplay } from '@/lib/birthday';
import type { Friend } from '@/types/database';

interface BirthdayListItemProps {
  friend: Friend;
  daysUntil: number;
  ageTurning: number;
  onPress: () => void;
}

export function BirthdayListItem({ friend, daysUntil, ageTurning, onPress }: BirthdayListItemProps) {
  const { t, i18n } = useTranslation();

  const daysLabel =
    daysUntil === 0
      ? t('home.today')
      : daysUntil === 1
        ? t('home.birthdayTomorrow')
        : t('home.birthdayIn', { days: daysUntil });

  return (
    <AnimatedPressable onPress={onPress} style={styles.row} scaleDown={0.98} haptic={false}>
      <CountdownRing
        daysUntil={daysUntil}
        size={52}
        strokeWidth={4}
        label={daysUntil > 0 ? (daysUntil === 1 ? t('home.tmrw') : t('home.days')) : undefined}
      />

      <View style={styles.info}>
        <Body style={styles.name}>{friend.name}</Body>
        <Muted style={styles.detail}>
          {formatBirthdayDisplay(friend.birthday!, i18n.language)}
          {ageTurning > 0 ? ` · ${t('friend.turnsAge', { age: ageTurning })}` : ''}
        </Muted>
      </View>

      <View style={[styles.badge, daysUntil <= 1 && styles.badgeUrgent]}>
        <Body style={[styles.badgeText, daysUntil <= 1 && styles.badgeTextUrgent]}>
          {daysLabel}
        </Body>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
  },
  detail: {
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.accent.gold + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeUrgent: {
    backgroundColor: colors.accent.red + '15',
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.accent.goldHover,
    fontFamily: fonts.body.semiBold,
  },
  badgeTextUrgent: {
    color: colors.accent.red,
  },
});
