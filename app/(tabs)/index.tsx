import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer, Heading, Body, Card } from '@/components/ui';
import { spacing, fontSize, colors } from '@/constants/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Body style={styles.greeting}>
          Hey, {user?.display_name} 👋
        </Body>
        <Heading style={styles.title}>{t('home.today')}</Heading>
      </View>

      <Card style={styles.emptyCard}>
        <Body style={styles.emptyEmoji}>🎂</Body>
        <Body style={styles.emptyText}>{t('home.noBirthdaysToday')}</Body>
      </Card>

      <View style={styles.section}>
        <Heading style={styles.sectionTitle}>{t('home.upcoming')}</Heading>
        <Card>
          <Body style={styles.placeholder}>
            Your friends' upcoming birthdays will appear here once you add them.
          </Body>
        </Card>
      </View>
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
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    marginBottom: spacing.md,
  },
  placeholder: {
    color: colors.text.muted,
    textAlign: 'center',
  },
});
