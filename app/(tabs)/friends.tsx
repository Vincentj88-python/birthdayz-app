import { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/useFriends';
import { sortByUpcoming } from '@/lib/birthday';
import { generateInviteCode, buildInviteMessage } from '@/lib/invite';
import { sendViaWhatsApp } from '@/lib/whatsapp';
import { supabase } from '@/lib/supabase';
import { ScreenContainer, Heading, Body, Button, Input, Card } from '@/components/ui';
import { FriendCard } from '@/components/FriendCard';
import { InviteBanner } from '@/components/InviteBanner';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Friend } from '@/types/database';

type SortMode = 'name' | 'birthday';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { friends, isLoading, refresh } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('name');

  const filteredFriends = useMemo(() => {
    let result = friends;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    if (sortBy === 'birthday') {
      result = sortByUpcoming(result);
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [friends, searchQuery, sortBy]);

  async function handleRequestBirthday(friend: Friend) {
    if (!user) return;
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
    }
  }

  if (friends.length === 0 && !isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Heading style={styles.title}>{t('friends.title')}</Heading>
        </View>
        <Card style={styles.emptyCard}>
          <Body style={styles.emptyEmoji}>👥</Body>
          <Body style={styles.emptyText}>{t('friends.emptyList')}</Body>
          <View style={styles.emptyActions}>
            <Button title={t('friends.addFriend')} onPress={() => router.push('/friend/add')} fullWidth />
            <Button
              title={t('friends.importContacts')}
              onPress={() => router.push('/friend/import')}
              variant="secondary"
              fullWidth
            />
          </View>
        </Card>
        <View style={{ marginTop: spacing.md }}>
          <InviteBanner />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false}>
      <View style={styles.headerPadded}>
        <View style={styles.titleRow}>
          <Heading style={styles.title}>{t('friends.title')}</Heading>
          <TouchableOpacity onPress={() => router.push('/friend/add')} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={28} color={colors.accent.red} />
          </TouchableOpacity>
        </View>

        <Input
          placeholder={t('friends.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.sortRow}>
          <View style={styles.sortPills}>
            {(['name', 'birthday'] as SortMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.sortPill, sortBy === mode && styles.sortPillActive]}
                onPress={() => setSortBy(mode)}
              >
                <Body style={[styles.sortText, sortBy === mode && styles.sortTextActive]}>
                  {mode === 'name' ? t('friends.sortByName') : t('friends.sortByBirthday')}
                </Body>
              </TouchableOpacity>
            ))}
          </View>
          <View />
        </View>
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.inviteBanner}>
            <InviteBanner />
          </View>
        }
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent.red} />}
        renderItem={({ item }) => (
          <FriendCard
            friend={item}
            onPress={() => router.push(`/friend/${item.id}`)}
            onRequestBirthday={!item.birthday ? () => handleRequestBirthday(item) : undefined}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerPadded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortPills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
  },
  sortPillActive: {
    backgroundColor: colors.accent.red,
  },
  sortText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body.semiBold,
    color: colors.text.secondary,
  },
  sortTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyActions: {
    width: '100%',
    gap: spacing.sm,
  },
  inviteBanner: {
    marginBottom: spacing.md,
  },
});
