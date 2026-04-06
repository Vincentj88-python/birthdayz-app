import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer, Heading, Body, Card, Button } from '@/components/ui';
import { spacing, fontSize, colors } from '@/constants/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Heading style={styles.title}>{t('settings.title')}</Heading>
      </View>

      <Card style={styles.profileCard}>
        <Body style={styles.name}>{user?.display_name}</Body>
        <Body style={styles.email}>{user?.email}</Body>
      </Card>

      <View style={styles.section}>
        <Card>
          <View style={styles.row}>
            <Body>{t('settings.language')}</Body>
            <Body style={styles.value}>{user?.language === 'af' ? 'Afrikaans' : 'English'}</Body>
          </View>
        </Card>
      </View>

      <View style={styles.signOut}>
        <Button
          title={t('auth.signOut')}
          onPress={signOut}
          variant="outline"
          fullWidth
        />
      </View>
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  email: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    color: colors.text.secondary,
  },
  signOut: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
