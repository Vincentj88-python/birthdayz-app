import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFriends } from '@/hooks/useFriends';
import { usePremium } from '@/hooks/usePremium';
import { supabase } from '@/lib/supabase';
import { ScreenContainer, Heading, Body, Muted, Button, Input } from '@/components/ui';
import { Paywall } from '@/components/Paywall';
import { colors, spacing, fontSize, borderRadius, fonts } from '@/constants/theme';
import { formatBirthdayDisplay } from '@/lib/birthday';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Friend } from '@/types/database';

const FREE_FRIEND_LIMIT = 10;

const RELATIONSHIPS = ['family', 'friend', 'colleague', 'other'] as const;
const RELATIONSHIP_KEYS: Record<string, string> = {
  family: 'friend.family',
  friend: 'friend.friendRelation',
  colleague: 'friend.colleague',
  other: 'friend.other',
};

export default function AddFriendScreen() {
  const { t } = useTranslation();
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();
  const { addFriend, updateFriend, friends } = useFriends();
  const { isPremium } = usePremium();
  const isEdit = !!friendId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [relationship, setRelationship] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Check friend limit for free users adding a new friend
  const atFriendLimit = !isEdit && !isPremium && friends.length >= FREE_FRIEND_LIMIT;

  useEffect(() => {
    if (friendId) {
      supabase
        .from('friends')
        .select('*')
        .eq('id', friendId)
        .single()
        .then(({ data }) => {
          if (data) {
            const f = data as Friend;
            setName(f.name);
            setPhone(f.phone || '');
            setBirthday(f.birthday ? new Date(f.birthday + 'T00:00:00') : null);
            setRelationship(f.relationship);
            setNotes(f.notes || '');
          }
        });
    }
  }, [friendId]);

  async function handleSave() {
    if (!name.trim()) return;
    if (atFriendLimit) {
      setShowPaywall(true);
      return;
    }
    setLoading(true);

    const data = {
      name: name.trim(),
      phone: phone.trim() || null,
      birthday: birthday ? birthday.toISOString().split('T')[0] : null,
      birthday_source: birthday ? 'manual' : null,
      relationship,
      notes: notes.trim() || null,
    };

    try {
      if (isEdit && friendId) {
        await updateFriend(friendId, data);
      } else {
        await addFriend(data);
      }
      router.back();
    } catch (err) {
      console.error('Save friend error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Heading style={styles.title}>
          {isEdit ? t('friend.editTitle') : t('friend.addTitle')}
        </Heading>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {!isEdit && (
          <TouchableOpacity
            style={styles.importRow}
            onPress={() => router.push('/friend/import')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={20} color={colors.accent.red} />
            <Body style={styles.importRowText}>{t('friends.importContacts')}</Body>
            <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}

        <Input
          label={t('friend.name')}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Margaret"
          autoFocus={!isEdit}
        />

        <View style={styles.field}>
          <Input
            label={t('friend.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder="+27 82 123 4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Muted style={styles.label}>{t('friend.birthday')}</Muted>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Body style={birthday ? styles.dateText : styles.datePlaceholder}>
              {birthday ? formatBirthdayDisplay(birthday.toISOString().split('T')[0]) : 'Select birthday'}
            </Body>
            {birthday && (
              <TouchableOpacity onPress={() => setBirthday(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthday || new Date(1990, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={(_, date) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (date) setBirthday(date);
              }}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <Button title={t('common.done')} onPress={() => setShowDatePicker(false)} variant="secondary" />
          )}
        </View>

        <View style={styles.field}>
          <Muted style={styles.label}>{t('friend.relationship')}</Muted>
          <View style={styles.pills}>
            {RELATIONSHIPS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, relationship === r && styles.pillActive]}
                onPress={() => setRelationship(relationship === r ? null : r)}
              >
                <Body style={[styles.pillText, relationship === r && styles.pillTextActive]}>
                  {t(RELATIONSHIP_KEYS[r])}
                </Body>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Input
            label={t('friend.notes')}
            value={notes}
            onChangeText={setNotes}
            placeholder="Likes gardening, loves rugby..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        <View style={styles.saveArea}>
          {atFriendLimit && (
            <Muted style={styles.limitWarning}>
              {t('premium.friendLimit', { limit: FREE_FRIEND_LIMIT })}
            </Muted>
          )}
          <Button
            title={atFriendLimit ? t('premium.upgradeToPro') : t('common.save')}
            onPress={handleSave}
            loading={loading}
            disabled={!name.trim()}
            fullWidth
          />
        </View>
      </ScrollView>

      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={t('premium.featureUnlimitedFriends')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
  },
  form: {
    flex: 1,
  },
  field: {
    marginTop: spacing.lg,
  },
  label: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 48,
  },
  dateText: {
    color: colors.text.primary,
  },
  datePlaceholder: {
    color: colors.text.muted,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.accent.red,
    borderColor: colors.accent.red,
  },
  pillText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontFamily: fonts.body.semiBold,
  },
  pillTextActive: {
    color: colors.white,
  },
  saveArea: {
    paddingVertical: spacing.xl,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  importRowText: {
    flex: 1,
    color: colors.accent.red,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.md,
  },
  limitWarning: {
    textAlign: 'center',
    color: colors.accent.gold,
    fontFamily: fonts.body.semiBold,
    marginBottom: spacing.md,
  },
});
