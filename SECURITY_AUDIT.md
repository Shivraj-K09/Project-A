# Security audit report

**Scope:** Mobile app codebase + Supabase project (read-only checks: advisors, `pg_policies`, table list).  
**Date:** 2026-03-20 (snapshot; re-run after major DB or auth changes).  
**Note:** Local `supabase/migrations/` may differ from what is applied in Supabase; **live policies in the dashboard/DB are authoritative**.

### Remediation status (manual)

| Item | Status |
|------|--------|
| P0 — `public.users` SELECT RLS | **Remediated** (replace broad OR with `auth_user_id = auth.uid()`-style policies; drop legacy `users_select_*` policies). |
| P1 — `public.feature_votes` SELECT | **Remediated** (scoped to caller’s profile row(s); dropped open SELECT policy). |
| P1 — `public.feature_requests` SELECT | **Remediated** — run [`supabase/migrations/20260320150000_feature_requests_select_authenticated.sql`](supabase/migrations/20260320150000_feature_requests_select_authenticated.sql) in Supabase (SELECT for `authenticated` only). |
| Auth — leaked password protection | **Accepted limitation** — Supabase gates HaveIBeenPwned / leaked-password checks behind **paid** plans; not available on free tier. Advisor may still flag it. |
| P2 — `prevent_system_field_escalation` `search_path` | **Remediated** — `ALTER FUNCTION public.prevent_system_field_escalation() SET search_path = public;` |
| P2 — Client PKCE (`lib/supabase.ts`) | **Remediated** — `auth.flowType: 'pkce'` |
| P2 — Explicit `WITH CHECK` on UPDATE policies | **Remediated** — run [`supabase/migrations/20260320140000_settings_rls_explicit_with_check.sql`](supabase/migrations/20260320140000_settings_rls_explicit_with_check.sql) in Supabase SQL Editor (idempotent). |
| P3 — ID docs | **Remediated** — [`docs/database-user-ids.md`](docs/database-user-ids.md) + pointer in `hooks/use-user.ts`. |
| P3 — `avatars` bucket public read | **Accepted** — public object URLs are intentional unless product requires private avatars (would need signed URLs / private bucket + RLS). |

### Plain language — snapshot status

**This audit’s tracked items:** Critical/high/medium issues from the 2026-03-20 review are **addressed** in code or via SQL migrations you run in Supabase (see status table above).

**Your action for DB:** Run any migration file in [`supabase/migrations/`](supabase/migrations/) that you have **not** yet executed in the hosted project (especially `*_feature_requests_*` if you want login-only roadmap reads).

**IDs when coding:** [`docs/database-user-ids.md`](docs/database-user-ids.md) explains **auth user id** vs **profile id** in `user_id` columns.

**Avatars:** Public read on the `avatars` bucket is **accepted** as-is (normal for profile pictures).

**Free plan:** “Leaked password” in Supabase may stay **off** — Pro-gated; not a missed fix.

**Ongoing:** Check **Database → Advisors** in Supabase for **new** lints not listed here.

---

## Critical

### `public.users` — overly permissive SELECT (RLS) — **remediated**

**Table:** `public.users`  
**Historical policies (before fix; observed via DB introspection):**

| Policy name | Risk |
|-------------|------|
| `users_select_own_or_active` | `USING` includes `(id = auth.uid()) OR ((archived_at IS NULL) AND (NOT COALESCE(is_deactivated, false)))` |
| `users_deactivated_select_own_or_active` | `USING` includes `(id = auth.uid()) OR (NOT is_deactivated)` |

With multi-profile, `public.users.id` is a **profile UUID**, not `auth.users.id`, so `id = auth.uid()` rarely matches. The **OR** branch matches **all** non-archived / non-deactivated rows. Permissive RLS combines policies with OR, so **any authenticated user can read essentially every active profile row**.

**Impact:** Mass PII exposure (phone, email, username, `avatar_url`, `public_key`, etc.) using only the anon key + a valid session.

**Fix (apply in Supabase SQL / migration):**

- Remove the broad OR; scope SELECT to rows the caller owns, e.g. `(SELECT auth.uid()) IS NOT DISTINCT FROM auth_user_id` (plus any **explicit** extra rules for public directory features, ideally on a narrow view or separate table).
- Drop or rewrite redundant SELECT policies so a single broad condition cannot reopen access.

**Related app code (not the root cause):** `hooks/use-user.ts`, `hooks/use-support-chat.ts`, `app/(settings)/account-center/request-info.tsx`.

**Status:** Addressed in Supabase (tight SELECT on ownership via `auth_user_id`; removed permissive `users_select_*` policies). Re-run advisors after future DDL changes.

---

## High

### `public.feature_votes` — all votes readable — **remediated**

**Table:** `public.feature_votes`  
**Historical issue:** Policy such as `votes_view_policy` (SELECT, role `public`, `USING (true)`) let anyone with API access read **all** vote rows, including **`user_id`**.

**Fix applied:** Restrict SELECT to the voter’s profile row(s) — `user_id` references `public.users.id`; predicate uses `auth_user_id = auth.uid()` via a subquery on `public.users` (see prior remediation notes / SQL). Totals remain on `feature_requests.vote_count`.

**Status:** Addressed in Supabase. Re-run advisors after future DDL changes.

---

### `public.feature_requests` — fully public read — **remediated (script)**

**Table:** `public.feature_requests`  
**Historical issue:** Policy `Public Read Feature Requests` (SELECT, role `public`, `USING (true)`) allowed **unauthenticated** reads.

**Applied:** Migration [`supabase/migrations/20260320150000_feature_requests_select_authenticated.sql`](supabase/migrations/20260320150000_feature_requests_select_authenticated.sql) — drop public SELECT, add **`feature_requests_select_authenticated`** (`TO authenticated`, `USING (true)`). Matches app: settings (including this screen) require login.

**Status:** Run SQL in Supabase. If `DROP POLICY` fails, list policies with `select policyname from pg_policies where tablename = 'feature_requests';` and adjust the drop name.

---

## Medium

### Supabase Auth — leaked password protection off — **accepted (free tier)**

**Source:** Supabase Security Advisor (`auth_leaked_password_protection`).  
**Ideal fix:** [Password security → Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

**Status:** **Not actionable on free plan** — the control is **locked / Pro-gated** in the dashboard for this project. Treat as accepted risk until you upgrade or Supabase changes tier limits. Keep other mitigations (strong minimum length, MFA if you add it, rate limiting via Supabase defaults).

---

### Function `public.prevent_system_field_escalation` — mutable `search_path` — **remediated**

**Source:** Security Advisor (`function_search_path_mutable`).  
**Fix:** [Linter 0011](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) — set `search_path` on the function.

**Applied:** `ALTER FUNCTION public.prevent_system_field_escalation() SET search_path = public;`

**Status:** Addressed in Supabase. Re-run **Database → Advisors**; the `0011_function_search_path_mutable` warning for this function should clear (refresh if cached).

---

### Client: OAuth / session flow — **PKCE (remediated)**

**File:** `lib/supabase.ts` — previously `auth.flowType: 'implicit'`.  
**Issue:** PKCE is preferred for native clients and avoids implicit token-in-URL patterns where applicable.  
**Applied:** `auth.flowType: 'pkce'` with existing SecureStore adapter and `detectSessionInUrl: false`.

**Status:** Updated in app. Smoke-test **Google** (`signInWithIdToken`), **OTP / phone**, and any future **browser OAuth** flows on device builds.

---

### UPDATE policies — explicit `WITH CHECK` — **remediated (script)**

**Tables:** `chat_settings`, `network_usage`, `privacy_settings`, `security_settings` — policies for commands **UPDATE** or **ALL** where `WITH CHECK` was omitted now get an explicit **`WITH CHECK` matching the existing `USING`** expression (no behavior change vs Postgres default; clearer for review and tooling).

**Applied:** Migration [`supabase/migrations/20260320140000_settings_rls_explicit_with_check.sql`](supabase/migrations/20260320140000_settings_rls_explicit_with_check.sql). **Run this file in the Supabase SQL Editor** on your project (safe to re-run; skips policies that already define `WITH CHECK`).

**Status:** After execution, confirm in **Table Editor → RLS** or `pg_policies` that `with_check` is populated for those policies.

---

### Two “user id” conventions — **documented**

**File:** `hooks/use-user.ts`  
**Issue:** `notification_settings` uses **profile** id (`getActiveUsersRowIdForAuth`); `chat_settings`, `privacy_settings`, `security_settings`, `network_usage`, `storage_usage` use **`user!.id`** (Supabase Auth id). Easy to misuse in new features.

**Fix:** [`docs/database-user-ids.md`](docs/database-user-ids.md) — table-level reference; `getActiveUsersRowIdForAuth` JSDoc links to it. Column renames (`profile_id` vs tying to `auth_user_id`) remain a future schema cleanup if desired.

---

## Low

### Storage: `avatars` bucket public read — **accepted**

**Table:** `storage.objects` — policy allowing SELECT when `bucket_id = 'avatars'`.  
**Impact:** Predictable URLs → expected for many apps.

**Status:** **Accepted** for current product (public avatar URLs). Tightening would mean private bucket + signed URLs or similar.

---

### Client secrets spot-check

- `lib/supabase.ts`: only `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (appropriate).
- No `service_role` / Stripe secret keys found in scanned TS sources.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in login flow is a **public** OAuth client id (expected).

---

## Supabase advisor shortcuts

- Run **Database → Advisors → Security** (and **Performance** if you use those lints) in the Supabase dashboard after DDL changes. **New** warnings since this snapshot are not listed here — treat the dashboard as authoritative and extend this doc when you triage them.
- RLS **enabled** on all listed `public` tables does not fix bad predicates; validate every policy `USING` / `WITH CHECK`.

---

## Prioritized remediation

1. ~~**P0:** Fix `public.users` SELECT policies (critical data leak).~~ **Done**
2. ~~**P1 — votes:** Tighten `public.feature_votes` SELECT.~~ **Done** — ~~**`feature_requests`** SELECT for authenticated only.~~ **Done** (run SQL migration on Supabase).
3. **P2:** ~~Function `prevent_system_field_escalation` `search_path`.~~ **Done** — ~~**PKCE** (`lib/supabase.ts`).~~ **Done** — ~~explicit **`WITH CHECK`** (settings tables migration).~~ **Done** (run SQL on Supabase). ~~Leaked-password protection~~ **N/A** on free tier (Pro-gated).
4. ~~**P3:** Document ID conventions~~ **Done** ([`docs/database-user-ids.md`](docs/database-user-ids.md)); ~~avatars~~ **Accepted** as public read unless requirements change.

---

*This document is descriptive guidance only; apply changes in Supabase SQL Editor or versioned migrations you control.*
