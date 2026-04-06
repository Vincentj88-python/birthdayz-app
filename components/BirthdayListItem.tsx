import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Body, Muted } from '@/components/ui';
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
  const { t } = useTranslation();
  const initial = friend.name.charAt(0).toUpperCase();

  const daysLabel =
    daysUntil === 1
      ? t('home.birthdayTomorrow')
      : t('home.birthdayIn', { days: daysUntil });

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Body style={styles.avatarText}>{initial}</Body>
      </View>

      <View style={styles.info}>
        <Body style={styles.name}>{friend.name}</Body>
        <Muted>
          {formatBirthdayDisplay(friend.birthday!)}
          {ageTurning > 0 ? ` · ${t('friend.turnsAge', { age: ageTurning })}` : ''}
        </Muted>
      </View>

      <View style={styles.daysBadge}>
        <Body style={styles.daysText}>{daysLabel}</Body>
      </View>
    </TouchableOpacity>
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.heading.bold,
    color: colors.white,
    fontSize: fontSize.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.body.semiBold,
  },
  daysBadge: {
    backgroundColor: colors.accent.gold + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  daysText: {
    fontSize: fontSize.xs,
    color: colors.accent.goldHover,
    fontFamily: fonts.body.semiBold,
  },
});
