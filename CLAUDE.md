# Birthdayz Mobile App

Expo (React Native) app with Expo Router, Supabase backend, TypeScript.

## Key conventions
- Use path aliases: `@/` maps to project root
- Theme constants in `constants/theme.ts` — never hardcode colors/fonts
- All text via `useTranslation()` hook (i18next) — no hardcoded strings
- Use typed Supabase client — types in `types/database.ts`
- Minimum font size 16px for body, minimum tap target 48px
- All fonts 500 weight or above
- Auth via `useAuth()` hook from `lib/auth-context.tsx`
- UI components in `components/ui/` — use barrel exports from `components/ui/index.ts`
- Premium feature checks via `usePremium()` hook from `hooks/usePremium.tsx`

## Supabase
- Project ref: `frxyflrzrthmfjhiwzjn`
- Region: eu-west-1
- Tables: users, friends, invites, wishes, notification_preferences
- RLS enabled on all tables — users can only access their own data
- Edge Functions: `generate-wish` (Claude Haiku, AI messages), `send-birthday-notifications` (cron daily 07:00 UTC)
- Secret: `CLAUDE_API_KEY` set in Supabase dashboard for Edge Function use

## Key lib files
- `lib/auth-context.tsx` — Supabase auth, Google Sign In, session handling
- `lib/friends-context.tsx` — FriendsProvider, CRUD, shared state
- `lib/notifications.ts` — Expo push token registration, stores token in users.push_token
- `lib/wishes.ts` — Client helper invoking `generate-wish` Edge Function
- `lib/revenuecat.ts` — RevenueCat SDK init (API key: `test_YCmuXoFeDRlJtEMHDAlyyeFsxSM`), entitlement check (`Birthdayz Pro`), restore

## Key hooks / context providers (loaded in app/_layout.tsx)
- `hooks/usePremium.tsx` — PremiumProvider: checks DB flags (trial/referral/ambassador) first, then RevenueCat entitlement

## Key components
- `components/NotificationPreferences.tsx` — Toggle card for 7/3/1 day + morning reminders
- `components/Paywall.tsx` — Bottom sheet modal with feature list, native RevenueCat paywall, restore purchases

## Premium gates (free tier limits)
- Max 10 friends (enforced in `app/friend/add.tsx`)
- AI messages locked (enforced in `app/friend/[id].tsx`)
- Advance reminders (7-day, 3-day) locked (enforced in `components/NotificationPreferences.tsx`)
- Premium-gated toggles show a badge and redirect to paywall on tap
