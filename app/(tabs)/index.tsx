import { useEffect, useRef } from 'react';
import { ScrollView, RefreshControl, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/useFriends';
import { getBirthdaysToday, getUpcomingBirthdays, daysUntilBirthday, getAgeTurning } from '@/lib/birthday';
import { sendViaWhatsApp } from '@/lib/whatsapp';
import { registerForPushNotifications } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { ScreenContainer, Heading, Body, Muted, Card, FadeIn } from '@/components/ui';
import { BirthdayHero } from '@/components/BirthdayHero';
import { BirthdayListItem } from '@/components/BirthdayListItem';
import { InviteBanner } from '@/components/InviteBanner';
import { spacing, fontSize, colors, fonts } from '@/constants/theme';
import type { Friend } from '@/types/database';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { friends, isLoading, refresh } = useFriends();
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (user?.id && !pushRegistered.current) {
      pushRegistered.current = true;
      registerForPushNotifications(user.id).catch(() => {});
    }
  }, [user?.id]);

  const birthdaysToday = getBirthdaysToday(friends);
  const upcomingBirthdays = getUpcomingBirthdays(friends, 30);
  const friendsWithBirthdays = friends.filter((f) => f.birthday).length;

  async function handleSendWish(friend: Friend) {
    if (!friend.phone) return;
    const age = getAgeTurning(friend.birthday!);
    const message = age > 0
      ? `Happy birthday, ${friend.name}! Wishing you a wonderful ${age}th birthday! 🎂`
      : `Happy birthday, ${friend.name}! 🎂`;

    sendViaWhatsApp(friend.phone, message);

    await supabase.from('wishes').insert({
      user_id: user?.id,
      friend_id: friend.id,
      year: new Date().getFullYear(),
      message,
      channel: 'whatsapp',
    });
  }

  const greeting = t(`home.greeting${getGreeting().charAt(0).toUpperCase() + getGreeting().slice(1)}`, {
    name: user?.display_name?.split(' ')[0] || '',
  });

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent.red} />}
      >
        {/* Greeting */}
        <FadeIn delay={0} duration={500}>
          <View style={styles.header}>
            <Body style={styles.greeting}>{greeting}</Body>
            <Heading style={styles.title}>{t('home.today')}</Heading>
          </View>
        </FadeIn>

        {/* Birthday Hero or Empty State */}
        <FadeIn delay={100} duration={500}>
          {birthdaysToday.length > 0 ? (
            <BirthdayHero friends={birthdaysToday} onSendWish={handleSendWish} />
          ) : (
            <Card style={styles.emptyCard}>
              <Body style={styles.emptyEmoji}>🎂</Body>
              <Body style={styles.emptyTitle}>{t('home.noBirthdaysToday')}</Body>
              <Muted style={styles.emptyHint}>{t('home.checkUpcoming')}</Muted>
            </Card>
          )}
        </FadeIn>

        {/* Stats Row */}
        <FadeIn delay={200} duration={500}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Body style={styles.statNumber}>{friends.length}</Body>
              <Muted style={styles.statLabel}>{t('home.statFriends')}</Muted>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Body style={styles.statNumber}>{friendsWithBirthdays}</Body>
              <Muted style={styles.statLabel}>{t('home.statBirthdays')}</Muted>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Body style={styles.statNumber}>{upcomingBirthdays.length}</Body>
              <Muted style={styles.statLabel}>{t('home.statUpcoming')}</Muted>
            </View>
          </View>
        </FadeIn>

        {/* Invite Banner */}
        <FadeIn delay={300} duration={500}>
          <View style={styles.inviteSection}>
            <InviteBanner />
          </View>
        </FadeIn>

        {/* Upcoming Birthdays */}
        <FadeIn delay={400} duration={500}>
          <View style={styles.section}>
            <Heading style={styles.sectionTitle}>{t('home.upcoming')}</Heading>
          </View>
        </FadeIn>

        {upcomingBirthdays.length > 0 ? (
          upcomingBirthdays.map((friend, index) => (
            <FadeIn key={friend.id} delay={450 + index * 60} duration={400} slideFrom={15}>
              <BirthdayListItem
                friend={friend}
                daysUntil={daysUntilBirthday(friend.birthday!)}
                ageTurning={getAgeTurning(friend.birthday!)}
                onPress={() => router.push(`/friend/${friend.id}`)}
              />
            </FadeIn>
          ))
        ) : (
          <FadeIn delay={450} duration={400}>
            <Card style={styles.emptyUpcoming}>
              <Body style={styles.emptyEmoji}>📅</Body>
              <Muted style={styles.emptyUpcomingText}>{t('home.emptyUpcoming')}</Muted>
            </Card>
          </FadeIn>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    color: colors.text.secondary,
    fontSize: fontSize.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    marginTop: spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.body.semiBold,
    color: colors.text.primary,
    fontSize: fontSize.md,
  },
  emptyHint: {
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.xxl,
    color: colors.accent.gold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  inviteSection: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
  },
  emptyUpcoming: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyUpcomingText: {
    textAlign: 'center',
  },
});
