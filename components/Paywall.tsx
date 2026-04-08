import { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { usePremium } from '@/hooks/usePremium';
import { restorePurchases } from '@/lib/revenuecat';
import { Heading, Body, Muted, Button } from '@/components/ui';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const FEATURES = [
  { icon: 'people' as const, key: 'premium.featureUnlimitedFriends' },
  { icon: 'sparkles' as const, key: 'premium.featureAiMessages' },
  { icon: 'notifications' as const, key: 'premium.featureAdvanceReminders' },
  { icon: 'heart' as const, key: 'premium.featurePriority' },
];

export function Paywall({ visible, onClose, feature }: PaywallProps) {
  const { t } = useTranslation();
  const { refresh } = usePremium();
  const [restoring, setRestoring] = useState(false);

  async function handleSubscribe() {
    try {
      const result = await RevenueCatUI.presentPaywall();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        await refresh();
        onClose();
      }
    } catch {
      // User cancelled or error — stay on paywall
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      await restorePurchases();
      await refresh();
      onClose();
    } catch {
      // No purchases to restore
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.crown}>
              <Ionicons name="diamond" size={32} color={colors.accent.gold} />
            </View>
            <Heading style={styles.title}>{t('premium.title')}</Heading>
            {feature && (
              <Body style={styles.featureNote}>
                {t('premium.unlockFeature', { feature })}
              </Body>
            )}
          </View>

          <View style={styles.features}>
            {FEATURES.map(({ icon, key }) => (
              <View key={key} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={icon} size={20} color={colors.accent.gold} />
                </View>
                <Body style={styles.featureText}>{t(key)}</Body>
              </View>
            ))}
          </View>

          <Button
            title={t('premium.subscribe')}
            onPress={handleSubscribe}
            fullWidth
          />

          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} disabled={restoring}>
            <Muted style={styles.restoreText}>
              {restoring ? t('common.loading') : t('premium.restore')}
            </Muted>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  closeBtn: {
    alignSelf: 'flex-end',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  crown: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    textAlign: 'center',
  },
  featureNote: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  features: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: fontSize.md,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  restoreText: {
    fontFamily: fonts.body.semiBold,
  },
});
