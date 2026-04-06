import { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer, Heading, Body, Muted, Button } from '@/components/ui';
import { spacing, fontSize, colors } from '@/constants/theme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.top}>
          <Body style={styles.emoji}>🎂</Body>
          <Heading style={styles.title}>{t('auth.welcome')}</Heading>
          <Body style={styles.subtitle}>{t('auth.subtitle')}</Body>
        </View>

        <View style={styles.bottom}>
          <Button
            title={t('auth.signInWithGoogle')}
            onPress={handleSignIn}
            loading={loading}
            fullWidth
          />
          {error && <Muted style={styles.error}>{error}</Muted>}
          <Muted style={styles.terms}>
            By signing in, you agree to our Terms & Privacy Policy
          </Muted>
        </View>
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
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: fontSize.lg,
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  bottom: {
    alignItems: 'center',
    gap: spacing.md,
  },
  error: {
    color: colors.error,
  },
  terms: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
