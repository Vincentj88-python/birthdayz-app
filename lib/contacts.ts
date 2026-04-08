import * as Contacts from 'expo-contacts';
import type { Friend } from '@/types/database';

export interface ContactWithBirthday {
  id: string;
  name: string;
  phone: string | null;
  birthday: string; // ISO date YYYY-MM-DD
}

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function getContactsWithBirthdays(): Promise<ContactWithBirthday[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Birthday, Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });

  return data
    .filter((c) => c.birthday && c.name)
    .map((c) => {
      const bday = c.birthday!;
      // expo-contacts birthday: { day, month, year? }
      // month is 0-indexed on iOS
      const year = bday.year || 1900;
      const month = String(bday.month + 1).padStart(2, '0');
      const day = String(bday.day).padStart(2, '0');

      const phone = c.phoneNumbers?.[0]?.number || null;

      return {
        id: c.id!,
        name: c.name!,
        phone: phone ? normalizePhone(phone) : null,
        birthday: `${year}-${month}-${day}`,
      };
    });
}

export function normalizePhone(phone: string): string {
  // Keep + prefix, strip everything else except digits
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export interface ContactWithoutBirthday {
  id: string;
  name: string;
  phone: string | null;
}

export async function getContactsWithoutBirthdays(): Promise<ContactWithoutBirthday[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Birthday, Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });

  return data
    .filter((c) => !c.birthday && c.name && c.phoneNumbers?.length)
    .map((c) => {
      const phone = c.phoneNumbers?.[0]?.number || null;
      return {
        id: c.id!,
        name: c.name!,
        phone: phone ? normalizePhone(phone) : null,
      };
    });
}

export function filterAlreadyImported(
  contacts: ContactWithBirthday[],
  existingFriends: Friend[],
): ContactWithBirthday[] {
  const existingPhones = new Set(
    existingFriends
      .filter((f) => f.phone)
      .map((f) => {
        const digits = f.phone!.replace(/\D/g, '');
        return digits.slice(-10); // Compare last 10 digits
      }),
  );

  return contacts.filter((c) => {
    if (!c.phone) return true; // Can't dedup without phone
    const digits = c.phone.replace(/\D/g, '');
    return !existingPhones.has(digits.slice(-10));
  });
}
