import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/useFriends';
import { sendViaWhatsApp } from '@/lib/whatsapp';
import { generateInviteCode, buildInviteMessage } from '@/lib/invite';
import {
  isBirthdayToday, daysUntilBirthday, getAge, getAgeTurning, formatBirthdayDisplay,
} from '@/lib/birthday';
import { ScreenContainer, Heading, Body, Muted, Button, Card } from '@/components/ui';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Friend, Wish } from '@/types/database';

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { deleteFriend } = useFriends();

  const [friend, setFriend] = useState<Friend | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('friends').select('*').eq('id', id).single(),
      supabase.from('wishes').select('*').eq('friend_id', id).order('sent_at', { ascending: false }),
    ]).then(([friendRes, wishesRes]) => {
      if (friendRes.data) setFriend(friendRes.data as Friend);
      if (wishesRes.data) setWishes(wishesRes.data as Wish[]);
      setLoading(false);
    });
  }, [id]);

  if (loading || !friend) {
    return (
      <ScreenContainer>
        <Body style={{ textAlign: 'center', marginTop: spacing.xxl }}>{t('common.loading')}</Body>
      </ScreenContainer>
    );
  }

  const hasBirthday = !!friend.birthday;
  const isToday = hasBirthday && isBirthdayToday(friend.birthday!);
  const daysUntil = hasBirthday ? daysUntilBirthday(friend.birthday!) : null;
  const age = hasBirthday ? getAge(friend.birthday!) : null;
  const ageTurning = hasBirthday ? getAgeTurning(friend.birthday!) : null;

  async function handleSendWish() {
    if (!friend.phone) {
      Alert.alert('No phone number', 'Add a phone number to send a wish via WhatsApp.');
      return;
    }
    const message = ageTurning && ageTurning > 0
      ? `Happy birthday, ${friend.name}! Wishing you a wonderful ${ageTurning}th birthday! 🎂`
      : `Happy birthday, ${friend.name}! 🎂`;

    sendViaWhatsApp(friend.phone, message);

    // Log wish
    await supabase.from('wishes').insert({
      user_id: user?.id,
      friend_id: friend.id,
      year: new Date().getFullYear(),
      message,
      channel: 'whatsapp',
    });
  }

  async function handleRequestBirthday() {
    if (!user) return;
    const code = generateInviteCode();
    const message = buildInviteMessage(friend.name, code, user.language);

    await supabase.from('invites').insert({
      from_user_id: user.id,
      friend_id: friend.id,
      invite_code: code,
      phone: friend.phone || '',
      language: user.language,
    });

    if (friend.phone) {
      sendViaWhatsApp(friend.phone, message);
    } else {
      Alert.alert(t('invite.sent'), message);
    }
  }

  function handleDelete() {
    Alert.alert(
      t('friends.deleteConfirmTitle'),
      t('friends.deleteConfirmMessage', { name: friend.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteFriend(friend.id);
            router.back();
          },
        },
      ],
    );
  }

  const initial = friend.name.charAt(0).toUpperCase();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/friend/add', params: { friendId: friend.id } })}
          hitSlop={12}
        >
          <Ionicons name="create-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Body style={styles.avatarText}>{initial}</Body>
          </View>
          <Heading style={styles.name}>{friend.name}</Heading>

          {hasBirthday ? (
            <>
              <Body style={styles.birthdayDate}>{formatBirthdayDisplay(friend.birthday!)}</Body>
              {age !== null && age > 0 && (
                <Muted>{age} years old</Muted>
              )}
              {daysUntil !== null && daysUntil > 0 && (
                <Muted style={styles.daysUntil}>
                  {daysUntil === 1
                    ? t('friend.nextBirthdayTomorrow')
                    : t('friend.nextBirthday', { days: daysUntil })}
                  {ageTurning && ageTurning > 0 ? ` · ${t('friend.turnsAge', { age: ageTurning })}` : ''}
                </Muted>
              )}
            </>
          ) : (
            <Muted>{t('friends.noBirthday')}</Muted>
          )}

          {friend.relationship && (
            <View style={styles.badge}>
              <Muted style={styles.badgeText}>{friend.relationship}</Muted>
            </View>
          )}
        </View>

        {friend.notes && (
          <Card style={styles.notesCard}>
            <Muted style={styles.notesLabel}>{t('friend.notes')}</Muted>
            <Body>{friend.notes}</Body>
          </Card>
        )}

        <View style={styles.actions}>
          {(isToday || (daysUntil !== null && daysUntil <= 7)) && hasBirthday && (
            <Button title={t('home.sendWish')} onPress={handleSendWish} fullWidth />
          )}
          {!hasBirthday && (
            <Button
              title={t('invite.requestBirthday')}
              onPress={handleRequestBirthday}
              variant="outline"
              fullWidth
            />
          )}
        </View>

        <View style={styles.wishSection}>
          <Heading style={styles.sectionTitle}>{t('friend.wishHistory')}</Heading>
          {wishes.length === 0 ? (
            <Card>
              <Muted style={styles.noWishes}>{t('friend.noWishes')}</Muted>
            </Card>
          ) : (
            wishes.map((wish) => (
              <Card key={wish.id} style={styles.wishCard}>
                <View style={styles.wishRow}>
                  <Body style={styles.wishYear}>{wish.year}</Body>
                  <Muted>{wish.channel}</Muted>
                </View>
                {wish.message && <Muted numberOfLines={2}>{wish.message}</Muted>}
              </Card>
            ))
          )}
        </View>

        <View style={styles.deleteArea}>
          <Button title={t('common.delete')} onPress={handleDelete} variant="outline" fullWidth />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  profile: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.heading.bold,
    color: colors.white,
    fontSize: fontSize.xxxl,
  },
  name: {
    fontSize: fontSize.xxl,
    textAlign: 'center',
  },
  birthdayDate: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  daysUntil: {
    marginTop: spacing.xs,
    color: colors.accent.gold,
    fontFamily: fonts.body.semiBold,
  },
  badge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  badgeText: {
    textTransform: 'capitalize',
    fontSize: fontSize.sm,
  },
  notesCard: {
    marginBottom: spacing.md,
  },
  notesLabel: {
    fontFamily: fonts.body.semiBold,
    marginBottom: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wishSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    marginBottom: spacing.md,
  },
  noWishes: {
    textAlign: 'center',
  },
  wishCard: {
    marginBottom: spacing.sm,
  },
  wishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  wishYear: {
    fontFamily: fonts.body.bold,
  },
  deleteArea: {
    paddingBottom: spacing.xxl,
  },
});
