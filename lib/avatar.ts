import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';
const AVATAR_URL_MARKERS = [
  `/storage/v1/object/public/${AVATAR_BUCKET}/`,
  `/storage/v1/object/sign/${AVATAR_BUCKET}/`,
  `/storage/v1/object/authenticated/${AVATAR_BUCKET}/`,
];

function getSupabaseOrigin() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

export function extractAvatarPath(avatarRef: string | null | undefined): string | null {
  if (!avatarRef) return null;

  const trimmed = avatarRef.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const supabaseOrigin = getSupabaseOrigin();
    if (!supabaseOrigin || parsed.origin !== supabaseOrigin) return null;

    const pathnameWithQuery = `${parsed.pathname}${parsed.search}`;
    for (const marker of AVATAR_URL_MARKERS) {
      const index = pathnameWithQuery.indexOf(marker);
      if (index >= 0) {
        const value = pathnameWithQuery.slice(index + marker.length).split('?')[0];
        return decodeURIComponent(value);
      }
    }

    return null;
  } catch {
    return /^https?:\/\//i.test(trimmed) ? null : trimmed;
  }
}

export async function resolveAvatarUrl(avatarRef: string | null | undefined): Promise<string | null> {
  if (!avatarRef) return null;

  const avatarPath = extractAvatarPath(avatarRef);
  if (!avatarPath) return avatarRef;

  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(avatarPath, 3600);
  if (error || !data?.signedUrl) {
    return avatarRef;
  }

  return data.signedUrl;
}
