import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Body, Muted } from '@/components/ui';
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Body style={styles.avatarText}>{initial}</Body>
      </View>

      <View style={styles.info}>
        <Body style={styles.name}>{friend.name}</Body>
        {hasBirthday ? (
          <Muted>
            {birthdayText}
            {ageTurning && ageTurning > 0 ? ` · ${t('friend.turnsAge', { age: ageTurning })}` : ''}
          </Muted>
        ) : (
          <Muted>{t('friends.noBirthday')}</Muted>
        )}
      </View>

      <View style={styles.right}>
        {friend.relationship && hasBirthday && (
          <View style={styles.badge}>
            <Muted style={styles.badgeText}>{friend.relationship}</Muted>
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
        {hasBirthday && daysUntil !== null && daysUntil <= 7 && (
          <View style={[styles.badge, styles.urgentBadge]}>
            <Muted style={styles.urgentText}>
              {daysUntil === 0 ? '🎂' : daysUntil === 1 ? t('home.birthdayTomorrow') : t('home.birthdayIn', { days: daysUntil })}
            </Muted>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  avatarText: {
    fontFamily: fonts.heading.bold,
    color: colors.white,
    fontSize: fontSize.lg,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  badge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  urgentBadge: {
    backgroundColor: colors.accent.red + '15',
  },
  urgentText: {
    fontSize: fontSize.xs,
    color: colors.accent.red,
    fontFamily: fonts.body.semiBold,
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
