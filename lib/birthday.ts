import type { Friend } from '@/types/database';

export function isBirthdayToday(birthday: string): boolean {
  const today = new Date();
  const bday = new Date(birthday + 'T00:00:00');
  return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
}

export function daysUntilBirthday(birthday: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bday = new Date(birthday + 'T00:00:00');
  let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());

  // Handle Feb 29 in non-leap years
  if (bday.getMonth() === 1 && bday.getDate() === 29) {
    const year = today.getFullYear();
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (!isLeapYear(year)) {
      next = new Date(year, 2, 1); // March 1
    }
  }

  if (next < today) {
    next.setFullYear(next.getFullYear() + 1);
  }

  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAge(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday + 'T00:00:00');
  let age = today.getFullYear() - bday.getFullYear();
  const monthDiff = today.getMonth() - bday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bday.getDate())) {
    age--;
  }
  return age;
}

export function getAgeTurning(birthday: string): number {
  const bday = new Date(birthday + 'T00:00:00');
  // If year is 1900 (sentinel for contacts without year), return 0
  if (bday.getFullYear() <= 1900) return 0;
  return getAge(birthday) + (isBirthdayToday(birthday) ? 0 : 1);
}

export function getBirthdaysToday(friends: Friend[]): Friend[] {
  return friends.filter((f) => f.birthday && isBirthdayToday(f.birthday));
}

export function getUpcomingBirthdays(friends: Friend[], days: number): Friend[] {
  return friends
    .filter((f) => {
      if (!f.birthday) return false;
      const d = daysUntilBirthday(f.birthday);
      return d > 0 && d <= days;
    })
    .sort((a, b) => daysUntilBirthday(a.birthday!) - daysUntilBirthday(b.birthday!));
}

export function sortByUpcoming(friends: Friend[]): Friend[] {
  const withBirthday = friends
    .filter((f) => f.birthday)
    .sort((a, b) => daysUntilBirthday(a.birthday!) - daysUntilBirthday(b.birthday!));
  const withoutBirthday = friends.filter((f) => !f.birthday);
  return [...withBirthday, ...withoutBirthday];
}

export function formatBirthdayDisplay(birthday: string, locale: string = 'en'): string {
  const bday = new Date(birthday + 'T00:00:00');
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(bday);
}
