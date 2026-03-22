# Which `user_id` is it?

Supabase Auth gives each login an **auth user id** (`auth.users.id` — in the app this is usually `user.id` from `useAuth()`).

`public.users` rows are **profiles**. Each profile has its own **`id`** (profile row id) and an **`auth_user_id`** pointing at the auth user.

Many tables use a column named `user_id`. **It is not always the same kind of id.**

## Auth user id (`user.id` in app)

Use for RLS: `user_id = auth.uid()`.

| Table / usage | Notes |
|---------------|--------|
| `privacy_settings` | `hooks/use-user.ts` — `.eq('user_id', user!.id)` |
| `security_settings` | same |
| `chat_settings` | same |
| `network_usage` | same |
| `storage_usage` | same |

## Profile id (`public.users.id`)

Use when the row is scoped to the **active profile**, not merely the login.

| Table / usage | Notes |
|---------------|--------|
| `notification_settings` | `useUserProfile` / `getActiveUsersRowIdForAuth` → `user_id` is profile id |
| `feature_requests` | Inserts use `profile.id` as `user_id` (`propose-feature.tsx`) |
| `feature_votes` | `user_id` is profile id (`feature-request.tsx`) |
| Support chat (`use-support-chat.ts`) | `user_id` is profile id |

## `public.users`

- **`id`** — profile primary key (used as `user_id` in votes, feature request author, notifications, …).
- **`auth_user_id`** — links profile to `auth.users.id`; use for “all profiles for this login”.

When adding features, check an existing similar table or this doc before wiring `user_id` filters or RLS.
