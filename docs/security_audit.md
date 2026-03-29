# Security Audit

Date: 2026-03-28

Scope:
- Expo mobile app codebase
- Supabase schema, RLS policies, storage policies, RPCs, and advisors
- Read-only review only; no database writes were performed

## Summary

The main risk is not a leaked secret in the app bundle. The main risk is backend overexposure through Supabase RLS and RPC grants.

Priority order:
1. Lock down `public.users` so authenticated users cannot read private account data from other users.
2. Revoke public/anonymous access to discovery and availability RPCs.
3. Make privacy settings real on the backend, not only in the UI.
4. Reduce or encrypt local contact-discovery caching.
5. Fix the `sync_contacts` function `search_path`.

## Findings

### Critical

#### 1. `public.users` exposes private account data to other authenticated users [Completed]

Status:
- Completed on 2026-03-28
- Supabase RLS was tightened so `public.users` is no longer readable as a broad authenticated profile source.
- App code was updated so `hooks/user/profile.ts` is explicitly modeled as owner-only/private profile access.
- Support inbox code was updated to tolerate restricted joined profile rows after the RLS change.

Issue:
- The client profile model expects sensitive columns from `public.users`, including `auth_user_id`, `email`, `phone_number`, `role`, and archival/deactivation state.
- Supabase RLS currently allows authenticated users to read active user rows broadly, and one policy can also expose archived rows if `is_deactivated = false`.

Evidence:
- App code reads sensitive columns from `users` in [hooks/user/profile.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile.ts#L63)
- Archive flow keeps `is_deactivated: false` in [hooks/user/account-actions.ts](F:/Social%20Media/final/main/mobile/hooks/user/account-actions.ts#L19)
- Supabase policies reviewed:
  - `users_select_own_or_active`
  - `users_deactivated_select_own_or_active`

Impact:
- Any authenticated user may be able to enumerate other users' phone numbers, email addresses, auth IDs, roles, public keys, and archived-account metadata.
- This is a direct privacy and account-enumeration problem.

Where to fix:
- Supabase first
- App code second

Supabase fix:
- Remove broad `SELECT` access from `public.users`.
- Keep owner-only access for private columns.
- Create a separate public-facing view/table for safe profile fields only, for example:
  - `id`
  - `username`
  - `first_name`
  - `last_name`
  - `avatar_url`
  - maybe a privacy-filtered `about`
- Rework RLS so:
  - users can read their own full row
  - other authenticated users can only read a minimal public profile surface
  - archived rows are never visible to non-owners

App fix:
- Stop selecting sensitive columns for general profile usage.
- Split app models into:
  - private self profile
  - public profile

Relevant files:
- [hooks/user/profile.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile.ts)
- [hooks/user/account-actions.ts](F:/Social%20Media/final/main/mobile/hooks/user/account-actions.ts)
- [hooks/use-support-management.ts](F:/Social%20Media/final/main/mobile/hooks/use-support-management.ts)

Recommended action:
- Done for the current environment. If you later add a public profile surface, keep it separate from `public.users`.

### High

#### 2. Public and anonymous access to RPCs allows user enumeration [Completed]

Status:
- Completed on 2026-03-28
- `anon` and `PUBLIC` execution was revoked for the risky RPCs.
- Only `authenticated` can execute the active app RPCs now.
- The legacy unused `secure_phone_update(uuid, ...)` overload was removed.
- The active RPC definitions were hardened with explicit authentication checks and fixed `search_path`.
- App call sites were verified and remain authenticated-only:
  - [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts)
  - [hooks/use-phone-setup.ts](F:/Social%20Media/final/main/mobile/hooks/use-phone-setup.ts)
  - [hooks/user/account-actions.ts](F:/Social%20Media/final/main/mobile/hooks/user/account-actions.ts)
  - [hooks/user/profile.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile.ts)
- Residual hardening such as rate limiting is still a good idea, but it is not required to close this specific issue.

Issue:
- These functions are executable by `anon` and/or `PUBLIC`:
  - `public.sync_contacts`
  - `public.check_phone_number_availability`
  - `public.check_username_availability`
  - `public.secure_phone_update`
- `sync_contacts` is `SECURITY DEFINER` and returns profile-matching data for phone numbers.

Evidence:
- App calls:
  - [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts#L106)
  - [hooks/use-phone-setup.ts](F:/Social%20Media/final/main/mobile/hooks/use-phone-setup.ts#L168)
  - [hooks/user/profile.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile.ts#L149)
- Supabase grants reviewed from `information_schema.role_routine_grants`

Impact:
- Attackers can test usernames and phone numbers at scale.
- Attackers can learn who is registered.
- `sync_contacts` can leak profile linkage and phone-match results beyond intended app flows.

Where to fix:
- Supabase

Supabase fix:
- Revoke `EXECUTE` from `anon` and `PUBLIC` for these functions.
- Grant `EXECUTE` only to `authenticated` where required.
- For `secure_phone_update`, keep execution limited to authenticated users only.
- Add server-side rate limiting or abuse controls around:
  - contact sync
  - username availability
  - phone availability
- For `sync_contacts`, enforce authenticated callers and return the minimum possible data.

App fix:
- No direct code bug here beyond depending on overly permissive backend behavior.
- After backend changes, verify these flows still work under authenticated-only access.

Relevant files:
- [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts)
- [hooks/use-phone-setup.ts](F:/Social%20Media/final/main/mobile/hooks/use-phone-setup.ts)
- [hooks/user/profile.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile.ts)

Recommended action:
- Fix together with the `public.users` RLS issue.

#### 3. Privacy controls are mostly cosmetic because avatars and discovery data bypass them [Completed]

Status:
- Completed on 2026-03-28
- Supabase `sync_contacts` was updated to honor privacy settings for `about` and `profile_photo`.
- App code was updated to stop bypassing privacy-filtered `about` values in contact discovery.
- App avatar handling was updated to support signed URLs and storage-path based avatars instead of relying on permanent public URLs.
- The `avatars` bucket was made private and the public-read path was removed.

Issue:
- The app offers privacy controls for profile photo and about visibility.
- But avatar URLs are permanent public URLs from a public bucket.
- Contact discovery returns avatar and about data through backend paths that do not appear to enforce those privacy choices.

Evidence:
- Privacy UI and settings:
  - [hooks/user/privacy.ts](F:/Social%20Media/final/main/mobile/hooks/user/privacy.ts)
  - [app/(settings)/privacy-security/privacy.tsx](F:/Social%20Media/final/main/mobile/app/(settings)/privacy-security/privacy.tsx)
- Public avatar usage:
  - [hooks/use-phone-setup.ts](F:/Social%20Media/final/main/mobile/hooks/use-phone-setup.ts#L149)
  - [hooks/user/profile-details.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile-details.ts#L89)
  - [docs/storage-avatars.md](F:/Social%20Media/final/main/mobile/docs/storage-avatars.md#L5)
- Contact discovery stores returned phone/profile data:
  - [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts#L122)

Impact:
- Users may believe profile-photo/about visibility is restricted when the backend and storage model do not actually enforce that.
- Public avatar URLs can be fetched by anyone who knows the URL.

Where to fix:
- Supabase and app code

Supabase fix:
- Decide whether avatars are intentionally public.
- If privacy settings must be enforced:
  - make `avatars` private
  - serve signed URLs with short TTL
  - enforce privacy rules in the query path that returns profile/about/avatar data
- Make `sync_contacts` and any profile-fetching path honor privacy settings.

App fix:
- Do not assume `getPublicUrl()` is compatible with private profile-photo settings.
- Update avatar loading to support signed URLs if bucket privacy changes.

Relevant files:
- [hooks/user/privacy.ts](F:/Social%20Media/final/main/mobile/hooks/user/privacy.ts)
- [app/(settings)/privacy-security/privacy.tsx](F:/Social%20Media/final/main/mobile/app/(settings)/privacy-security/privacy.tsx)
- [hooks/use-phone-setup.ts](F:/Social%20Media/final/main/mobile/hooks/use-phone-setup.ts)
- [hooks/user/profile-details.ts](F:/Social%20Media/final/main/mobile/hooks/user/profile-details.ts)
- [docs/storage-avatars.md](F:/Social%20Media/final/main/mobile/docs/storage-avatars.md)

Recommended action:
- Either document avatars as intentionally public and remove misleading privacy wording, or enforce privacy server-side.

### Medium

#### 4. Contact discovery cache stores sensitive address-book match data in `AsyncStorage` [Completed]

Status:
- Completed on 2026-03-28
- Contact discovery results are no longer persisted to `AsyncStorage`.
- Legacy cached discovery data is cleared on load.
- Only the sync timestamp is persisted; the matched graph and phone-linked result set now stay in memory only for the current app session.
- No SQL changes were required for this issue.

Issue:
- Matched contacts and their phone numbers are stored in plaintext local app storage.

Evidence:
- Reads cache from `AsyncStorage` in [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts#L37)
- Stores matched phone number in [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts#L136)
- Writes cache in [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts#L179)

Impact:
- On rooted devices, through local backups, or through device compromise, cached contacts and membership matches may be exposed.
- This is not the biggest platform risk, but it is still avoidable sensitive-data retention.

Where to fix:
- App code

App fix:
- Do not persist raw matched contact data unless necessary.
- If persistence is required:
  - store less data
  - remove raw phone numbers from cache
  - prefer encrypted storage
  - expire and clear cache aggressively

Relevant files:
- [hooks/use-contact-discovery.ts](F:/Social%20Media/final/main/mobile/hooks/use-contact-discovery.ts)

Recommended action:
- Reduce the cache surface after backend lockdown is complete.

### Low

#### 5. `public.sync_contacts` has mutable `search_path` [Completed]

Status:
- Completed on 2026-03-28
- `public.sync_contacts` now sets an explicit `search_path`.
- The function is using `SET search_path TO public, auth, pg_catalog`.
- No app code changes were required for this issue.

Issue:
- Supabase security advisor reports `public.sync_contacts` as having mutable `search_path`.
- This matters more because the function is `SECURITY DEFINER`.

Evidence:
- Supabase advisor warning: `function_search_path_mutable`

Impact:
- This is a lower-probability hardening issue, but it should still be fixed for a privileged function.

Where to fix:
- Supabase

Supabase fix:
- Recreate `public.sync_contacts` with explicit `SET search_path TO public, pg_catalog`.
- Keep all table references schema-qualified.

Recommended action:
- Fix while changing RPC grants and privacy behavior.

## Things I did not find

- No `service_role` key exposed in the client code
- `.env` is gitignored
- The client only references:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Supabase Fix Checklist

- Tighten `public.users` RLS:
  - remove broad read access
  - keep owner-only access for private data
  - hide archived rows from non-owners
- Introduce a minimal public profile surface
- Revoke `EXECUTE` from `anon` and `PUBLIC` where not needed:
  - `sync_contacts`
  - `check_phone_number_availability`
  - `check_username_availability`
  - `secure_phone_update`
- Restrict RPCs to authenticated callers
- Add abuse/rate-limit protections to enumeration-sensitive RPCs
- Make privacy settings enforceable in backend reads
- Decide whether `avatars` stays public or moves to signed/private delivery
- Fix `sync_contacts` `search_path`

## App Fix Checklist

- Split private self-profile access from public profile access
- Stop treating `public.users` as a safe general-purpose profile source
- Update avatar handling if bucket privacy changes
- Reduce or encrypt contact-discovery cache
- Re-test these flows after backend changes:
  - login
  - phone setup
  - username check
  - contact discovery
  - profile view/edit
  - support chat

## Notes

- This audit was based on the current repository and current Supabase metadata on 2026-03-28.
- No SQL migrations or data changes were applied during this review.
