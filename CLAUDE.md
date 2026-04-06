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

## Supabase
- Project ref: `frxyflrzrthmfjhiwzjn`
- Region: eu-west-1
- Tables: users, friends, invites, wishes, notification_preferences
- RLS enabled on all tables — users can only access their own data
