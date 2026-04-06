import { ScrollView, RefreshControl, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/useFriends';
import { getBirthdaysToday, getUpcomingBirthdays, daysUntilBirthday, getAgeTurning } from '@/lib/birthday';
import { sendViaWhatsApp } from '@/lib/whatsapp';
import { supabase } from '@/lib/supabase';
import { ScreenContainer, Heading, Body, Card } from '@/components/ui';
import { BirthdayHero } from '@/components/BirthdayHero';
import { BirthdayListItem } from '@/components/BirthdayListItem';
import { spacing, fontSize, colors } from '@/constants/theme';
import type { Friend } from '@/types/database';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { friends, isLoading, refresh } = useFriends();

  const birthdaysToday = getBirthdaysToday(friends);
  const upcomingBirthdays = getUpcomingBirthdays(friends, 30);

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

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent.red} />}
      >
        <View style={styles.header}>
          <Body style={styles.greeting}>Hey, {user?.display_name} 👋</Body>
          <Heading style={styles.title}>{t('home.today')}</Heading>
        </View>

        {birthdaysToday.length > 0 ? (
          <BirthdayHero friends={birthdaysToday} onSendWish={handleSendWish} />
        ) : (
          <Card style={styles.emptyCard}>
            <Body style={styles.emptyEmoji}>🎂</Body>
            <Body style={styles.emptyText}>{t('home.noBirthdaysToday')}</Body>
          </Card>
        )}

        <View style={styles.section}>
          <Heading style={styles.sectionTitle}>{t('home.upcoming')}</Heading>
          {upcomingBirthdays.length > 0 ? (
            upcomingBirthdays.map((friend) => (
              <BirthdayListItem
                key={friend.id}
                friend={friend}
                daysUntil={daysUntilBirthday(friend.birthday!)}
                ageTurning={getAgeTurning(friend.birthday!)}
                onPress={() => router.push(`/friend/${friend.id}`)}
              />
            ))
          ) : (
            <Card>
              <Body style={styles.emptyText}>{t('home.emptyUpcoming')}</Body>
            </Card>
          )}
        </View>
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
    fontSize: fontSize.md,
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
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    marginBottom: spacing.md,
  },
});
