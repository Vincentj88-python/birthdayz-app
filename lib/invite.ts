import { nanoid } from 'nanoid/non-secure';

export function generateInviteCode(): string {
  return nanoid(8);
}

export function buildInviteMessage(
  friendName: string,
  inviteCode: string,
  language: string = 'en',
): string {
  if (language === 'af') {
    return `Hallo ${friendName}! Ek gebruik Birthdayz sodat ek nooit weer iemand se verjaarsdag vergeet nie. Kan jy joune hier byvoeg? Dit vat 10 sekondes 🎂 https://birthdayz.app/invite/${inviteCode}`;
  }
  return `Hey ${friendName}! I'm using Birthdayz so I never forget important birthdays. Could you add yours here? Takes 10 seconds 🎂 https://birthdayz.app/invite/${inviteCode}`;
}
