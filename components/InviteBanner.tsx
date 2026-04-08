import { View, Share, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { AnimatedPressable, Body, Muted } from '@/components/ui';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export function InviteBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();

  async function handleInvite() {
    const isAf = user?.language === 'af';
    const message = isAf
      ? `Ek gebruik Birthdayz sodat ek nooit weer iemand se verjaarsdag vergeet nie. Laai dit af en vergeet nooit weer 'n verjaarsdag nie! 🎂 https://birthdayz.app`
      : `I'm using Birthdayz so I never forget important birthdays. Download it and never miss a birthday again! 🎂 https://birthdayz.app`;

    await Share.share({
      message,
      url: 'https://birthdayz.app',
    });
  }

  return (
    <AnimatedPressable onPress={handleInvite} style={styles.banner} scaleDown={0.98}>
      <View style={styles.iconWrap}>
        <Ionicons name="gift" size={24} color={colors.white} />
      </View>
      <View style={styles.textWrap}>
        <Body style={styles.title}>{t('invite.inviteFriends')}</Body>
        <Muted style={styles.subtitle}>{t('invite.inviteSubtitle')}</Muted>
      </View>
      <Ionicons name="share-outline" size={22} color={colors.white} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.red,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.body.bold,
    fontSize: fontSize.md,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
});
