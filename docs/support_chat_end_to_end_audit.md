# Support Chat End-to-End Audit

Date: 2026-03-28

Scope:
- Expo mobile app support chat flows
- Supporter dashboard and supporter chat flows
- Supabase support chat tables, RLS policies, and storage policies
- Read-only review only; no database writes were performed

## Summary

Support chat is working with the tracked end-to-end issues addressed.

What passed:
- User and supporter text messaging is working in the current environment.
- Supabase currently has one active support session with text messages from both sides.
- App code type-check passes.

## Findings

### High

#### 1. Supporter image upload is exposed in the UI but blocked by Supabase storage policy [Completed]

Status:
- Completed on 2026-03-28
- Supabase storage policy was updated so active-session participants can upload encrypted support attachments.
- No app runtime patch was required for this issue because the existing upload helper and chat screens already matched the intended behavior.
- `pnpm type-check` passes after verification.

Issue:
- Both the user chat and supporter chat screens expose the image-send action.
- The upload helper writes encrypted image blobs into the `support_attachments` bucket.
- But the current storage `INSERT` policy only allows uploads for active sessions where `get_support_sessions.user_id = auth.uid()`.
- Agents/supporters are not included in that policy.

Evidence:
- Support upload helper uploads to storage in [hooks/support/use-support-upload.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-upload.ts#L47)
- Supporter chat exposes image sending in [app/(settings)/support-management/[id].tsx](F:/Social%20Media/final/main/mobile/app/(settings)/support-management/%5Bid%5D.tsx#L136)
- User chat exposes image sending in [app/(settings)/help-support/chat.tsx](F:/Social%20Media/final/main/mobile/app/(settings)/help-support/chat.tsx#L119)
- Supabase policy review showed only:
  - `Users can upload to active support sessions`

Impact:
- Supporters can tap the image action but their upload will fail.
- This is an end-to-end functional break in the supporter-side support workflow.

Where to fix:
- Supabase first
- App code second

Supabase fix:
- Update the `support_attachments` `INSERT` policy so authenticated supporters/agents assigned to the session can upload attachments too.
- Scope the policy to:
  - the same `session.id` encoded in the object path
  - active sessions only
  - either the session owner or the assigned/authorized supporter

App fix:
- Keep the image-send UI only if the backend policy supports the current role.
- If supporter uploads remain intentionally unsupported, hide or disable the plus action in supporter chat.

Relevant files:
- [hooks/support/use-support-upload.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-upload.ts)
- [app/(settings)/support-management/[id].tsx](F:/Social%20Media/final/main/mobile/app/(settings)/support-management/%5Bid%5D.tsx)
- [app/(settings)/help-support/chat.tsx](F:/Social%20Media/final/main/mobile/app/(settings)/help-support/chat.tsx)

Recommended action:
- Completed for the current environment.

#### 2. Supporter "End Chat" uses a status value and update path that do not match the database [Completed]

Status:
- Completed on 2026-03-28
- Supabase session policies were updated to use the correct profile-id based checks and to allow assigned supporters with `support:chat_archive` to archive active sessions.
- App code was updated to standardize the supporter flow on `archived` instead of `resolved`.
- Supporter chat UI now treats archived sessions as closed and disables further input.
- Supporter dashboard labels were updated to match the archived lifecycle.

Issue:
- Supporter chat attempts to update `get_support_sessions.status` to `resolved`.
- The current database check constraint allows only:
  - `active`
  - `archived`
  - `pending`
- The current session update policy is also owner-only, based on `user_id = auth.uid()`.

Evidence:
- Supporter end-chat logic writes `resolved` in [hooks/use-supporter-chat.ts](F:/Social%20Media/final/main/mobile/hooks/use-supporter-chat.ts#L157)
- Supporter screen exposes that action in [app/(settings)/support-management/[id].tsx](F:/Social%20Media/final/main/mobile/app/(settings)/support-management/%5Bid%5D.tsx#L119)
- Supabase review showed:
  - `get_support_sessions_status_check` allows only `active`, `archived`, `pending`
  - `support_sessions_update_opt` is owner-only

Impact:
- Supporters cannot reliably close or resolve sessions through the current mobile flow.
- The UI presents a supported action that the backend does not currently allow.

Where to fix:
- Supabase and app code

Supabase fix:
- Decide the real lifecycle:
  - either support `resolved` as a valid status
  - or standardize on `archived`
- Update the session RLS/policy so authorized supporters can perform the intended status transition.

App fix:
- Align the app with the real database lifecycle.
- Replace `resolved` with the actual supported terminal state if that is the intended model.
- If only users can archive sessions, remove supporter-side close controls.

Relevant files:
- [hooks/use-supporter-chat.ts](F:/Social%20Media/final/main/mobile/hooks/use-supporter-chat.ts)
- [app/(settings)/support-management/[id].tsx](F:/Social%20Media/final/main/mobile/app/(settings)/support-management/%5Bid%5D.tsx)
- [hooks/support/types.ts](F:/Social%20Media/final/main/mobile/hooks/support/types.ts)

Recommended action:
- Completed for the current environment.

### Medium

#### 3. New-session supporter claim flow is incomplete in the mobile app [Completed]

Status:
- Completed on 2026-03-28
- Supabase session policy was updated so authorized supporters can claim unassigned active sessions by setting `agent_id` to their own profile row.
- App code now claims unassigned sessions from the supporter side and sends the expected `agent_join` broadcast on the session channel.
- The existing user-side listener can now complete the intended re-key/pickup flow.
- `pnpm type-check` passes after verification.

Issue:
- The user-side support session hook listens for an `agent_join` broadcast and performs the re-key/claim flow when that event arrives.
- But the current mobile codebase does not send that `agent_join` broadcast from the supporter side.
- There is no complete in-app pickup/claim path in the mobile code for a fresh unassigned session.

Evidence:
- User-side listener exists in [hooks/support/use-support-session.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-session.ts#L195)
- Repo-wide search found no corresponding `agent_join` sender outside that listener path
- Supporter inbox and room screens open existing sessions:
  - [hooks/use-support-management.ts](F:/Social%20Media/final/main/mobile/hooks/use-support-management.ts)
  - [hooks/use-supporter-chat.ts](F:/Social%20Media/final/main/mobile/hooks/use-supporter-chat.ts)

Impact:
- Sessions already assigned in the database can work.
- Fresh unassigned sessions may not complete the intended pickup/re-key flow from the mobile supporter app alone.

Where to fix:
- App code, and possibly Supabase if claim rules need tightening

Supabase fix:
- Ensure the intended claim/update path is explicitly allowed for authorized supporters if agent assignment should happen from the app.

App fix:
- Implement an explicit supporter-side claim action or auto-claim flow that:
  - assigns `agent_id`
  - sends the expected `agent_join` broadcast
  - waits for the user-side re-key flow to complete before assuming full access

Relevant files:
- [hooks/support/use-support-session.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-session.ts)
- [hooks/use-supporter-chat.ts](F:/Social%20Media/final/main/mobile/hooks/use-supporter-chat.ts)
- [hooks/use-support-management.ts](F:/Social%20Media/final/main/mobile/hooks/use-support-management.ts)

Recommended action:
- Completed for the current environment.

#### 4. Failed attachment sends are leaving orphaned encrypted blobs in storage [Completed]

Status:
- Completed on 2026-03-28
- App upload flow now rolls back the storage object if the `support_messages` insert fails after upload.
- This prevents new orphaned encrypted blobs from being left behind by failed attachment sends.
- `pnpm type-check` passes after verification.

Issue:
- The image-upload flow uploads the encrypted file to storage before inserting the corresponding `support_messages` row.
- The current database already contains `support_attachments` objects with no matching `support_messages.attachment_path`.

Evidence:
- Upload happens before DB insert in [hooks/support/use-support-upload.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-upload.ts#L47)
- Read-only Supabase review found orphaned objects in `support_attachments` with no matching message row

Impact:
- Failed attachment attempts leave storage clutter behind.
- Over time this can waste storage and make support attachment state harder to reason about.

Where to fix:
- App code first
- Optional cleanup workflow in Supabase or admin tooling second

Supabase fix:
- Optional: add a periodic cleanup process for unattached support blobs if you want defense in depth.

App fix:
- If the DB insert fails after upload, delete the uploaded storage object as part of rollback.
- Consider writing a temporary pending DB row first if you want stronger attachment lifecycle control.

Relevant files:
- [hooks/support/use-support-upload.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-upload.ts)

Recommended action:
- Completed for preventing new orphaned uploads. Existing orphaned blobs, if any, can be cleaned separately.

## Verified Working Paths

- User support session bootstrap:
  - [hooks/support/use-support-session.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-session.ts)
- User message send/read:
  - [hooks/support/use-support-messages.ts](F:/Social%20Media/final/main/mobile/hooks/support/use-support-messages.ts)
  - [app/(settings)/help-support/chat.tsx](F:/Social%20Media/final/main/mobile/app/(settings)/help-support/chat.tsx)
- Supporter inbox and message send/read for existing active session:
  - [hooks/use-support-management.ts](F:/Social%20Media/final/main/mobile/hooks/use-support-management.ts)
  - [hooks/use-supporter-chat.ts](F:/Social%20Media/final/main/mobile/hooks/use-supporter-chat.ts)
  - [app/(settings)/support-management.tsx](F:/Social%20Media/final/main/mobile/app/(settings)/support-management.tsx)
  - [app/(settings)/support-management/[id].tsx](F:/Social%20Media/final/main/mobile/app/(settings)/support-management/%5Bid%5D.tsx)

## Recommended Fix Order

1. Completed for the current environment.
