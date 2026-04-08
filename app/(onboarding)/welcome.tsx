import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ScreenContainer, Heading, Body, Button, Input } from '@/components/ui';
import { spacing, fontSize, colors } from '@/constants/theme';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { session, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(
    session?.user?.user_metadata?.full_name || ''
  );
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    if (!session?.user || !displayName.trim()) return;

    setLoading(true);
    try {
      // Try insert first (new user)
      const { error: insertError } = await supabase.from('users').insert({
        id: session.user.id,
        email: session.user.email,
        display_name: displayName.trim(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // If user already exists, just update the display name
      if (insertError) {
        await supabase
          .from('users')
          .update({ display_name: displayName.trim() })
          .eq('id', session.user.id);
      }

      await refreshUser();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.content}>
          <Body style={styles.emoji}>👋</Body>
          <Heading style={styles.title}>{t('onboarding.yourName')}</Heading>
          <Input
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            autoFocus
          />
        </View>
        <Button
          title={t('common.continue')}
          onPress={handleComplete}
          loading={loading}
          disabled={!displayName.trim()}
          fullWidth
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: fontSize.xxl,
    textAlign: 'center',
  },
});
