import { useState, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/useFriends';
import {
  getContactsWithoutBirthdays,
  ContactWithoutBirthday,
} from '@/lib/contacts';
import { generateInviteCode, buildInviteMessage } from '@/lib/invite';
import { sendViaWhatsApp } from '@/lib/whatsapp';
import { supabase } from '@/lib/supabase';
import { ScreenContainer, Heading, Body, Muted, Button, Input } from '@/components/ui';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RequestBirthdaysScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { friends, addFriend } = useFriends();

  const [contacts, setContacts] = useState<ContactWithoutBirthday[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [createdFriends, setCreatedFriends] = useState<Map<string, string>>(new Map());

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    const allContacts = await getContactsWithoutBirthdays();

    // Filter out contacts already in friends list (by phone)
    const existingPhones = new Set(
      friends
        .filter((f) => f.phone)
        .map((f) => f.phone!.replace(/\D/g, '').slice(-10))
    );

    const filtered = allContacts.filter((c) => {
      if (!c.phone) return false;
      const digits = c.phone.replace(/\D/g, '');
      return !existingPhones.has(digits.slice(-10));
    });

    setContacts(filtered);
    setLoading(false);
  }

  function toggleContact(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c.id)));
    }
  }

  async function handleSendRequests() {
    if (!user || selected.size === 0) return;
    setSending(true);

    const toSend = contacts.filter((c) => selected.has(c.id));

    // Batch create friend records + invites
    for (const contact of toSend) {
      try {
        // Create friend record (no birthday)
        const friend = await addFriend({
          name: contact.name,
          phone: contact.phone,
          birthday: null,
          birthday_source: 'invite',
        });

        if (friend) {
          setCreatedFriends((prev) => new Map(prev).set(contact.id, friend.id));

          // Create invite
          const code = generateInviteCode();
          await supabase.from('invites').insert({
            from_user_id: user.id,
            friend_id: friend.id,
            invite_code: code,
            phone: contact.phone || '',
            language: user.language,
          });

          // Open WhatsApp
          const message = buildInviteMessage(contact.name, code, user.language);
          if (contact.phone) {
            sendViaWhatsApp(contact.phone, message);
          }

          setSentIds((prev) => new Set(prev).add(contact.id));

          // Small delay between sends so user can process
          if (toSend.indexOf(contact) < toSend.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (err) {
        console.error('Error sending request to', contact.name, err);
      }
    }

    setSending(false);
    Alert.alert(
      t('requestBirthdays.doneTitle'),
      t('requestBirthdays.doneMessage', { count: sentIds.size + 1 }),
      [{ text: t('common.done'), onPress: () => router.back() }]
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Body style={styles.center}>{t('common.loading')}</Body>
      </ScreenContainer>
    );
  }

  if (contacts.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Body style={styles.emoji}>🎉</Body>
          <Heading style={styles.emptyTitle}>{t('requestBirthdays.allDone')}</Heading>
          <Body style={styles.emptyText}>{t('requestBirthdays.allDoneMessage')}</Body>
          <Button title={t('common.done')} onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Heading style={styles.title}>{t('requestBirthdays.title')}</Heading>
        <View style={{ width: 28 }} />
      </View>

      <Muted style={styles.subtitle}>{t('requestBirthdays.subtitle')}</Muted>

      <Input
        placeholder={t('friends.search')}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.countRow}>
        <Muted>{t('requestBirthdays.found', { count: contacts.length })}</Muted>
        <TouchableOpacity onPress={toggleAll}>
          <Body style={styles.selectAllText}>
            {selected.size === contacts.length ? t('contacts.deselectAll') : t('contacts.selectAll')}
          </Body>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          const isSent = sentIds.has(item.id);
          return (
            <TouchableOpacity
              style={[
                styles.contactRow,
                isSelected && styles.contactSelected,
                isSent && styles.contactSent,
              ]}
              onPress={() => !isSent && toggleContact(item.id)}
              activeOpacity={isSent ? 1 : 0.7}
              disabled={isSent}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked, isSent && styles.checkboxSent]}>
                {isSent ? (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : isSelected ? (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : null}
              </View>
              <View style={styles.contactInfo}>
                <Body style={styles.contactName}>{item.name}</Body>
                {item.phone && <Muted>{item.phone}</Muted>}
              </View>
              {isSent && (
                <Muted style={styles.sentBadge}>{t('invite.sent')}</Muted>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.bottomBar}>
        <Button
          title={sending
            ? t('requestBirthdays.sending')
            : t('requestBirthdays.sendRequests', { count: selected.size })
          }
          onPress={handleSendRequests}
          loading={sending}
          disabled={selected.size === 0 || sending}
          fullWidth
        />
        <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
          <Muted style={styles.skipText}>{t('requestBirthdays.skip')}</Muted>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  selectAllText: {
    color: colors.accent.red,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactSelected: {
    borderColor: colors.accent.red,
  },
  contactSent: {
    borderColor: colors.whatsapp,
    opacity: 0.7,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.accent.red,
    borderColor: colors.accent.red,
  },
  checkboxSent: {
    backgroundColor: colors.whatsapp,
    borderColor: colors.whatsapp,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: fonts.body.semiBold,
  },
  sentBadge: {
    color: colors.whatsapp,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
  },
  bottomBar: {
    paddingVertical: spacing.md,
  },
  skipBtn: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  skipText: {
    fontFamily: fonts.body.semiBold,
  },
  center: {
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
