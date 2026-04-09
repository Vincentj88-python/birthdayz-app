import { useState, useEffect, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFriends } from '@/hooks/useFriends';
import {
  requestContactsPermission,
  getContactsWithBirthdays,
  filterAlreadyImported,
  ContactWithBirthday,
} from '@/lib/contacts';
import { formatBirthdayDisplay } from '@/lib/birthday';
import { ScreenContainer, Heading, Body, Muted, Button, Input } from '@/components/ui';
import { colors, fonts, spacing, fontSize, borderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ImportContactsScreen() {
  const { t, i18n } = useTranslation();
  const { friends, batchAddFriends } = useFriends();

  const [contacts, setContacts] = useState<ContactWithBirthday[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (!loading && !permissionDenied && contacts.length === 0) {
      router.replace('/friend/request-birthdays');
    }
  }, [loading, permissionDenied, contacts.length]);

  async function loadContacts() {
    const granted = await requestContactsPermission();
    if (!granted) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    const allContacts = await getContactsWithBirthdays();
    const filtered = filterAlreadyImported(allContacts, friends);
    setContacts(filtered);
    setSelected(new Set(filtered.map((c) => c.id)));
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

  async function handleImport() {
    setImporting(true);
    const toImport = contacts
      .filter((c) => selected.has(c.id))
      .map((c) => ({
        name: c.name,
        phone: c.phone,
        birthday: c.birthday,
        birthday_source: 'contacts' as const,
      }));

    await batchAddFriends(toImport);
    // Navigate to request birthdays screen for contacts WITHOUT birthdays
    router.replace('/friend/request-birthdays');
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Body style={styles.center}>{t('common.loading')}</Body>
      </ScreenContainer>
    );
  }

  if (permissionDenied) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Body style={styles.emoji}>📱</Body>
          <Heading style={styles.emptyTitle}>{t('contacts.permissionTitle')}</Heading>
          <Body style={styles.emptyText}>{t('contacts.permissionMessage')}</Body>
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
        <Heading style={styles.title}>{t('contacts.importTitle')}</Heading>
        <View style={{ width: 28 }} />
      </View>

      <Input
        placeholder={t('friends.search')}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.countRow}>
        <Muted>{t('contacts.found', { count: contacts.length })}</Muted>
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
          return (
            <TouchableOpacity
              style={[styles.contactRow, isSelected && styles.contactSelected]}
              onPress={() => toggleContact(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={colors.white} />}
              </View>
              <View style={styles.contactInfo}>
                <Body style={styles.contactName}>{item.name}</Body>
                <Muted>{formatBirthdayDisplay(item.birthday, i18n.language)}</Muted>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.importBar}>
        <Button
          title={importing ? t('contacts.importing') : t('contacts.imported', { count: selected.size })}
          onPress={handleImport}
          loading={importing}
          disabled={selected.size === 0}
          fullWidth
        />
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: fonts.body.semiBold,
  },
  importBar: {
    paddingVertical: spacing.md,
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
