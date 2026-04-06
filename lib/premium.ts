import type { User } from '@/types/database';

export function hasPremium(user: User): boolean {
  const now = new Date();

  if (user.is_premium) return true;
  if (user.trial_ends_at && new Date(user.trial_ends_at) > now) return true;
  if (user.referral_premium_ends_at && new Date(user.referral_premium_ends_at) > now) return true;
  if (user.is_ambassador) return true;

  return false;
}

export function hasPaidPremium(user: User): boolean {
  return user.is_premium || user.is_ambassador;
}
