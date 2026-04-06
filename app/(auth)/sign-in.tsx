import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { ScreenContainer, Heading, Body, Muted, Button, Input } from '@/components/ui';
import { spacing, fontSize, colors } from '@/constants/theme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev email auth state
  const [showDevAuth, setShowDevAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleGoogleSignIn() {
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

  async function handleEmailSignIn() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch {
      // If sign in fails, try sign up
      try {
        await signUpWithEmail(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error'));
      }
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
            onPress={handleGoogleSignIn}
            loading={loading && !showDevAuth}
            fullWidth
          />

          {__DEV__ && !showDevAuth && (
            <Button
              title="Dev Sign In (Email)"
              onPress={() => setShowDevAuth(true)}
              variant="secondary"
              fullWidth
            />
          )}

          {showDevAuth && (
            <View style={styles.devAuth}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Button
                title="Sign In / Sign Up"
                onPress={handleEmailSignIn}
                loading={loading}
                fullWidth
              />
            </View>
          )}

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
  devAuth: {
    width: '100%',
    gap: spacing.sm,
  },
  error: {
    color: colors.error,
  },
  terms: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
