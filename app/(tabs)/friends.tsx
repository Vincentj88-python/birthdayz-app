import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer, Heading, Body, Card, Button } from '@/components/ui';
import { spacing, fontSize, colors } from '@/constants/theme';

export default function FriendsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Heading style={styles.title}>{t('friends.title')}</Heading>
      </View>

      <Card style={styles.emptyCard}>
        <Body style={styles.emptyEmoji}>👥</Body>
        <Body style={styles.emptyText}>
          No friends added yet. Import from contacts or add them manually.
        </Body>
        <View style={styles.actions}>
          <Button title={t('friends.addFriend')} onPress={() => {}} fullWidth />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxxl,
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
    marginBottom: spacing.lg,
  },
  actions: {
    width: '100%',
  },
});
