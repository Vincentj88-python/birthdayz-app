export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string;
  language: string;
  birthday: string | null;
  avatar_url: string | null;
  timezone: string;
  push_token: string | null;
  is_premium: boolean;
  trial_ends_at: string | null;
  premium_since: string | null;
  referral_premium_ends_at: string | null;
  referral_count: number;
  is_ambassador: boolean;
  referred_by_user_id: string | null;
  created_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  birthday: string | null;
  birthday_source: string | null;
  notes: string | null;
  relationship: string | null;
  is_favorite: boolean;
  linked_user_id: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  from_user_id: string;
  friend_id: string | null;
  invite_code: string;
  phone: string;
  language: string;
  status: 'pending' | 'completed' | 'expired';
  birthday_submitted: string | null;
  referral_rewarded: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface Wish {
  id: string;
  user_id: string;
  friend_id: string | null;
  year: number;
  message: string | null;
  channel: string | null;
  sent_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  remind_7_days: boolean;
  remind_3_days: boolean;
  remind_1_day: boolean;
  remind_morning: boolean;
  reminder_time: string;
  created_at: string;
}
