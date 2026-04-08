import { View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedPressable, Body, Muted } from '@/components/ui';
import { colors, fonts, spacing, borderRadius, fontSize } from '@/constants/theme';
import { formatBirthdayDisplay, daysUntilBirthday, getAgeTurning } from '@/lib/birthday';
import type { Friend } from '@/types/database';

interface FriendCardProps {
  friend: Friend;
  onPress: () => void;
  onRequestBirthday?: () => void;
  inviteStatus?: 'pending' | 'completed' | null;
}

export function FriendCard({ friend, onPress, onRequestBirthday, inviteStatus }: FriendCardProps) {
  const { t } = useTranslation();
  const initial = friend.name.charAt(0).toUpperCase();

  const hasBirthday = !!friend.birthday;
  const birthdayText = hasBirthday ? formatBirthdayDisplay(friend.birthday!) : null;
  const daysUntil = hasBirthday ? daysUntilBirthday(friend.birthday!) : null;
  const ageTurning = hasBirthday ? getAgeTurning(friend.birthday!) : null;

  const isUrgent = daysUntil !== null && daysUntil <= 7;
  const daysLabel = daysUntil === 0
    ? '🎂'
    : daysUntil === 1
      ? t('home.birthdayTomorrow')
      : daysUntil !== null && daysUntil <= 7
        ? t('home.birthdayIn', { days: daysUntil })
        : null;

  return (
    <AnimatedPressable onPress={onPress} style={styles.card} scaleDown={0.98} haptic={false}>
      <View style={[styles.avatar, isUrgent && styles.avatarUrgent]}>
        <Body style={styles.avatarText}>{initial}</Body>
      </View>

      <View style={styles.info}>
        <Body style={styles.name}>{friend.name}</Body>
        {hasBirthday ? (
          <Muted style={styles.detail}>
            {birthdayText}
            {ageTurning && ageTurning > 0 ? ` · ${t('friend.turnsAge', { age: ageTurning })}` : ''}
            {friend.relationship ? ` · ${friend.relationship}` : ''}
          </Muted>
        ) : (
          <Muted style={styles.detail}>{t('friends.noBirthday')}</Muted>
        )}
      </View>

      <View style={styles.right}>
        {isUrgent && daysLabel && (
          <View style={[styles.badge, daysUntil === 0 ? styles.badgeToday : styles.badgeUrgent]}>
            <Body style={[styles.badgeText, daysUntil === 0 ? styles.badgeTextToday : styles.badgeTextUrgent]}>
              {daysLabel}
            </Body>
          </View>
        )}
        {!hasBirthday && inviteStatus === 'pending' && (
          <Muted style={styles.inviteSent}>{t('friends.inviteSent')}</Muted>
        )}
        {!hasBirthday && !inviteStatus && onRequestBirthday && (
          <TouchableOpacity
            style={styles.requestBtn}
            onPress={(e) => { e.stopPropagation(); onRequestBirthday(); }}
            hitSlop={8}
          >
            <Muted style={styles.requestText}>{t('invite.requestBirthday')}</Muted>
          </TouchableOpacity>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarUrgent: {
    backgroundColor: colors.accent.red,
  },
  avatarText: {
    fontFamily: fonts.heading.bold,
    color: colors.white,
    fontSize: fontSize.lg,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
  },
  detail: {
    marginTop: 2,
    fontSize: fontSize.sm,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeUrgent: {
    backgroundColor: colors.accent.red + '15',
  },
  badgeToday: {
    backgroundColor: colors.accent.red,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body.semiBold,
  },
  badgeTextUrgent: {
    color: colors.accent.red,
  },
  badgeTextToday: {
    color: colors.white,
  },
  inviteSent: {
    fontSize: fontSize.xs,
    color: colors.accent.gold,
    fontFamily: fonts.body.semiBold,
  },
  requestBtn: {
    borderWidth: 1,
    borderColor: colors.accent.red,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  requestText: {
    fontSize: fontSize.xs,
    color: colors.accent.red,
    fontFamily: fonts.body.semiBold,
  },
});
