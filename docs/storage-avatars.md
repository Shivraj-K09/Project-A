# Avatars storage (`avatars` bucket)

## Current model (accepted)

The **`avatars`** bucket is typically configured with **public read** so profile images load via stable URLs. That matches common social/chat apps and [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) is tracked as **low risk** / intentional unless you need strict confidentiality.

## If you need private avatars later

1. Make the bucket **private** and tighten `storage.objects` SELECT policies.
2. Serve images with **signed URLs** (short TTL) from the app or a small Edge Function.
3. Update any code that assumes a permanent public URL for `avatar_url`.

No code change is required for the default public-avatars setup.
