import { useState, useEffect } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { usePremium } from '@/hooks/usePremium';
import { Paywall } from '@/components/Paywall';
import { Body, Muted, Card } from '@/components/ui';
import { colors, spacing, fonts, fontSize } from '@/constants/theme';
import type { NotificationPreferences as NotifPrefs } from '@/types/database';

const PREMIUM_KEYS = new Set(['remind_7_days', 'remind_3_days']);

export function NotificationPreferences() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [prefs, setPrefs] = useState<NotifPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPrefs(data as NotifPrefs);
        } else {
          // Create default preferences
          const defaults: Omit<NotifPrefs, 'id' | 'created_at'> = {
            user_id: user.id,
            remind_7_days: true,
            remind_3_days: true,
            remind_1_day: true,
            remind_morning: true,
            reminder_time: '08:00',
          };
          supabase
            .from('notification_preferences')
            .insert(defaults)
            .select()
            .single()
            .then(({ data: created }) => {
              if (created) setPrefs(created as NotifPrefs);
            });
        }
        setLoading(false);
      });
  }, [user?.id]);

  async function togglePref(key: keyof Pick<NotifPrefs, 'remind_7_days' | 'remind_3_days' | 'remind_1_day' | 'remind_morning'>) {
    if (!prefs) return;

    // Gate advance reminders behind premium
    if (PREMIUM_KEYS.has(key) && !isPremium) {
      setShowPaywall(true);
      return;
    }

    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue });
    await supabase
      .from('notification_preferences')
      .update({ [key]: newValue })
      .eq('user_id', prefs.user_id);
  }

  if (loading || !prefs) return null;

  const toggles: { key: keyof Pick<NotifPrefs, 'remind_7_days' | 'remind_3_days' | 'remind_1_day' | 'remind_morning'>; label: string; premium: boolean }[] = [
    { key: 'remind_7_days', label: t('notifications.remind7Days'), premium: true },
    { key: 'remind_3_days', label: t('notifications.remind3Days'), premium: true },
    { key: 'remind_1_day', label: t('notifications.remind1Day'), premium: false },
    { key: 'remind_morning', label: t('notifications.remindMorning'), premium: false },
  ];

  return (
    <>
      <Card style={styles.card}>
        <Body style={styles.title}>{t('notifications.title')}</Body>
        <Muted style={styles.subtitle}>{t('notifications.subtitle')}</Muted>
        {toggles.map(({ key, label, premium }) => (
          <View key={key} style={styles.row}>
            <Body style={styles.label}>
              {label}
              {premium && !isPremium ? ' ✦' : ''}
            </Body>
            <Switch
              value={premium && !isPremium ? false : prefs[key]}
              onValueChange={() => togglePref(key)}
              trackColor={{ false: colors.border, true: colors.accent.red }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </Card>

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={t('premium.featureAdvanceReminders')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
  },
});
