import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/useFriends';
import { sendViaWhatsApp } from '@/lib/whatsapp';
import { generateInviteCode, buildInviteMessage } from '@/lib/invite';
import { generateWishes } from '@/lib/wishes';
import {
  isBirthdayToday, daysUntilBirthday, getAge, getAgeTurning, formatBirthdayDisplay,
} from '@/lib/birthday';
import { usePremium } from '@/hooks/usePremium';
import { Paywall } from '@/components/Paywall';
import { ScreenContainer, Heading, Body, Muted, Button, Card } from '@/components/ui';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Friend, Wish } from '@/types/database';

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { deleteFriend } = useFriends();
  const { isPremium } = usePremium();

  const [friend, setFriend] = useState<Friend | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  // AI wish modal state
  const [wishModalVisible, setWishModalVisible] = useState(false);
  const [aiWishes, setAiWishes] = useState<string[]>([]);
  const [selectedWish, setSelectedWish] = useState('');
  const [generatingWishes, setGeneratingWishes] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('friends').select('*').eq('id', id).single(),
      supabase.from('wishes').select('*').eq('friend_id', id).order('sent_at', { ascending: false }),
    ]).then(([friendRes, wishesRes]) => {
      if (friendRes.data) setFriend(friendRes.data as Friend);
      if (wishesRes.data) setWishes(wishesRes.data as Wish[]);
      setLoading(false);
    });
  }, [id]);

  if (loading || !friend) {
    return (
      <ScreenContainer>
        <Body style={{ textAlign: 'center', marginTop: spacing.xxl }}>{t('common.loading')}</Body>
      </ScreenContainer>
    );
  }

  const hasBirthday = !!friend.birthday;
  const isToday = hasBirthday && isBirthdayToday(friend.birthday!);
  const daysUntil = hasBirthday ? daysUntilBirthday(friend.birthday!) : null;
  const age = hasBirthday ? getAge(friend.birthday!) : null;
  const ageTurning = hasBirthday ? getAgeTurning(friend.birthday!) : null;

  async function handleSendWish() {
    if (!friend?.phone) {
      Alert.alert(t('wishes.noPhone'), t('wishes.noPhoneMessage'));
      return;
    }

    // Free users: basic message directly
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    // Premium users: AI-generated options
    setWishModalVisible(true);
    setGeneratingWishes(true);
    setAiWishes([]);
    setSelectedWish('');

    try {
      const generated = await generateWishes({
        name: friend.name,
        age: ageTurning ?? null,
        relationship: friend.relationship,
        language: user?.language ?? 'en',
        notes: friend.notes,
      });
      setAiWishes(generated);
      if (generated.length > 0) setSelectedWish(generated[0]);
    } catch (e) {
      console.error('AI wish generation failed:', e);
      const fallback = ageTurning && ageTurning > 0
        ? t('wishes.defaultMessageWithAge', { name: friend.name, age: ageTurning })
        : t('wishes.defaultMessage', { name: friend.name });
      setAiWishes([fallback]);
      setSelectedWish(fallback);
    } finally {
      setGeneratingWishes(false);
    }
  }

  function handleQuickWish() {
    if (!friend?.phone) {
      Alert.alert(t('wishes.noPhone'), t('wishes.noPhoneMessage'));
      return;
    }
    const message = ageTurning && ageTurning > 0
      ? t('wishes.defaultMessageWithAge', { name: friend.name, age: ageTurning })
      : t('wishes.defaultMessage', { name: friend.name });

    sendViaWhatsApp(friend.phone, message);

    supabase.from('wishes').insert({
      user_id: user?.id,
      friend_id: friend.id,
      year: new Date().getFullYear(),
      message,
      channel: 'whatsapp',
    });
  }

  async function handleConfirmWish() {
    if (!selectedWish || !friend?.phone) return;

    sendViaWhatsApp(friend.phone, selectedWish);
    setWishModalVisible(false);

    await supabase.from('wishes').insert({
      user_id: user?.id,
      friend_id: friend.id,
      year: new Date().getFullYear(),
      message: selectedWish,
      channel: 'whatsapp',
    });

    // Refresh wish history
    const { data } = await supabase
      .from('wishes')
      .select('*')
      .eq('friend_id', friend.id)
      .order('sent_at', { ascending: false });
    if (data) setWishes(data as Wish[]);
  }

  async function handleRequestBirthday() {
    if (!user || !friend) return;
    const code = generateInviteCode();
    const message = buildInviteMessage(friend.name, code, user.language);

    await supabase.from('invites').insert({
      from_user_id: user.id,
      friend_id: friend.id,
      invite_code: code,
      phone: friend.phone || '',
      language: user.language,
    });

    if (friend.phone) {
      sendViaWhatsApp(friend.phone, message);
    } else {
      Alert.alert(t('invite.sent'), message);
    }
  }

  function handleDelete() {
    if (!friend) return;
    Alert.alert(
      t('friends.deleteConfirmTitle'),
      t('friends.deleteConfirmMessage', { name: friend.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteFriend(friend.id);
            router.back();
          },
        },
      ],
    );
  }

  const initial = friend.name.charAt(0).toUpperCase();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/friend/add', params: { friendId: friend.id } })}
          hitSlop={12}
        >
          <Ionicons name="create-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Body style={styles.avatarText}>{initial}</Body>
          </View>
          <Heading style={styles.name}>{friend.name}</Heading>

          {hasBirthday ? (
            <>
              <Body style={styles.birthdayDate}>{formatBirthdayDisplay(friend.birthday!, i18n.language)}</Body>
              {age !== null && age > 0 && (
                <Muted>{t('friend.yearsOld', { age })}</Muted>
              )}
              {daysUntil !== null && daysUntil > 0 && (
                <Muted style={styles.daysUntil}>
                  {daysUntil === 1
                    ? t('friend.nextBirthdayTomorrow')
                    : t('friend.nextBirthday', { days: daysUntil })}
                  {ageTurning && ageTurning > 0 ? ` · ${t('friend.turnsAge', { age: ageTurning })}` : ''}
                </Muted>
              )}
            </>
          ) : (
            <Muted>{t('friends.noBirthday')}</Muted>
          )}

          {friend.relationship && (
            <View style={styles.badge}>
              <Muted style={styles.badgeText}>{friend.relationship}</Muted>
            </View>
          )}
        </View>

        {friend.notes && (
          <Card style={styles.notesCard}>
            <Muted style={styles.notesLabel}>{t('friend.notes')}</Muted>
            <Body>{friend.notes}</Body>
          </Card>
        )}

        <View style={styles.actions}>
          {(isToday || (daysUntil !== null && daysUntil <= 7)) && hasBirthday && (
            <>
              <Button title={t('home.sendWish')} onPress={handleQuickWish} variant="secondary" fullWidth />
              <Button
                title={isPremium ? t('wishes.aiWish') : `${t('wishes.aiWish')} ✦`}
                onPress={handleSendWish}
                fullWidth
              />
            </>
          )}
          {!hasBirthday && (
            <Button
              title={t('invite.requestBirthday')}
              onPress={handleRequestBirthday}
              variant="outline"
              fullWidth
            />
          )}
        </View>

        <View style={styles.wishSection}>
          <Heading style={styles.sectionTitle}>{t('friend.wishHistory')}</Heading>
          {wishes.length === 0 ? (
            <Card>
              <Muted style={styles.noWishes}>{t('friend.noWishes')}</Muted>
            </Card>
          ) : (
            wishes.map((wish) => (
              <Card key={wish.id} style={styles.wishCard}>
                <View style={styles.wishRow}>
                  <Body style={styles.wishYear}>{wish.year}</Body>
                  <Muted>{wish.channel}</Muted>
                </View>
                {wish.message && <Muted numberOfLines={2}>{wish.message}</Muted>}
              </Card>
            ))
          )}
        </View>

        <View style={styles.deleteArea}>
          <Button title={t('common.delete')} onPress={handleDelete} variant="outline" fullWidth />
        </View>
      </ScrollView>

      <Modal
        visible={wishModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWishModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Heading style={styles.modalTitle}>{t('wishes.chooseMessage')}</Heading>
              <TouchableOpacity onPress={() => setWishModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {generatingWishes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.red} />
                <Body style={styles.loadingText}>{t('wishes.generating')}</Body>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Muted style={styles.modalSubtitle}>{t('wishes.tapToSelect')}</Muted>
                {aiWishes.map((wish, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.wishOption,
                      selectedWish === wish && styles.wishOptionSelected,
                    ]}
                    onPress={() => setSelectedWish(wish)}
                    activeOpacity={0.7}
                  >
                    <Body
                      style={[
                        styles.wishOptionText,
                        selectedWish === wish && styles.wishOptionTextSelected,
                      ]}
                    >
                      {wish}
                    </Body>
                    {selectedWish === wish && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.accent.red} />
                    )}
                  </TouchableOpacity>
                ))}

                <Muted style={styles.editLabel}>{t('wishes.editBelow')}</Muted>
                <TextInput
                  style={styles.editInput}
                  value={selectedWish}
                  onChangeText={setSelectedWish}
                  multiline
                  textAlignVertical="top"
                />

                <Button
                  title={t('wishes.sendViaWhatsApp')}
                  onPress={handleConfirmWish}
                  fullWidth
                  disabled={!selectedWish}
                />
                <View style={{ height: spacing.lg }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={t('premium.featureAiMessages')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  profile: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.heading.bold,
    color: colors.white,
    fontSize: fontSize.xxxl,
  },
  name: {
    fontSize: fontSize.xxl,
    textAlign: 'center',
  },
  birthdayDate: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  daysUntil: {
    marginTop: spacing.xs,
    color: colors.accent.gold,
    fontFamily: fonts.body.semiBold,
  },
  badge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  badgeText: {
    textTransform: 'capitalize',
    fontSize: fontSize.sm,
  },
  notesCard: {
    marginBottom: spacing.md,
  },
  notesLabel: {
    fontFamily: fonts.body.semiBold,
    marginBottom: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wishSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    marginBottom: spacing.md,
  },
  noWishes: {
    textAlign: 'center',
  },
  wishCard: {
    marginBottom: spacing.sm,
  },
  wishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  wishYear: {
    fontFamily: fonts.body.bold,
  },
  deleteArea: {
    paddingBottom: spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalSubtitle: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  wishOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  wishOptionSelected: {
    borderColor: colors.accent.red,
    backgroundColor: '#FFF0EE',
  },
  wishOptionText: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  wishOptionTextSelected: {
    color: colors.text.primary,
  },
  editLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontFamily: fonts.body.semiBold,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: 80,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
});
