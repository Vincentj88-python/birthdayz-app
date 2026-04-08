import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { usePremium } from '@/hooks/usePremium';
import { ScreenContainer, Heading, Body, Muted, Card, Button } from '@/components/ui';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { Paywall } from '@/components/Paywall';
import { spacing, fontSize, colors, fonts, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

  const trialActive = user?.trial_ends_at && new Date(user.trial_ends_at) > new Date();
  const trialDaysLeft = trialActive
    ? Math.ceil((new Date(user!.trial_ends_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Heading style={styles.title}>{t('settings.title')}</Heading>
        </View>

        <Card style={styles.profileCard}>
          <Body style={styles.name}>{user?.display_name}</Body>
          <Body style={styles.email}>{user?.email}</Body>
        </Card>

        {/* Premium / Plan section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.premiumCard, isPremium && styles.premiumCardActive]}
            onPress={() => !isPremium && setShowPaywall(true)}
            activeOpacity={isPremium ? 1 : 0.8}
          >
            <View style={styles.premiumHeader}>
              <View style={styles.premiumIcon}>
                <Ionicons
                  name="diamond"
                  size={20}
                  color={isPremium ? colors.accent.gold : colors.text.muted}
                />
              </View>
              <View style={styles.premiumInfo}>
                <Body style={styles.premiumTitle}>
                  {isPremium ? t('premium.planPro') : t('premium.planFree')}
                </Body>
                <Muted>
                  {isPremium
                    ? trialActive
                      ? t('premium.trialDaysLeft', { days: trialDaysLeft })
                      : t('premium.activeSubscription')
                    : t('premium.upgradeDescription')}
                </Muted>
              </View>
              {!isPremium && (
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Card>
            <View style={styles.row}>
              <Body>{t('settings.language')}</Body>
              <Body style={styles.value}>{user?.language === 'af' ? 'Afrikaans' : 'English'}</Body>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <NotificationPreferences />
        </View>

        <View style={styles.signOut}>
          <Button
            title={t('auth.signOut')}
            onPress={signOut}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
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
  premiumCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  premiumCardActive: {
    borderColor: colors.accent.gold,
    backgroundColor: '#FFF9F0',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize.md,
  },
  signOut: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
