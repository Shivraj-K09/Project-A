import { useAuth } from '@/contexts/auth-context';
import { resolveAvatarUrl } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Query Keys ────────────────────────────────────────────
export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
  username: (username: string) => [...userKeys.all, 'username', username] as const,
};

/**
 * `public.users.id` for the active (non-archived) profile; auth session id is `auth.users.id`.
 */
export async function getActiveUsersRowIdForAuth(authUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getAllUsersRowIdsForAuth(authUserId: string): Promise<string[]> {
  const { data, error } = await supabase.from('users').select('id').eq('auth_user_id', authUserId);
  if (error) throw error;
  return (data ?? []).map((r) => r.id);
}

// ─── Types ─────────────────────────────────────────────────
// Private self-profile model backed by `public.users`.
// Do not reuse this type for other users or public profile surfaces.
export type UserProfile = {
  id: string;
  auth_user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  country_code: string | null;
  avatar_url: string | null;
  provider: string | null;
  role: string;
  role_id: string | null;
  created_at: string;
  updated_at: string;
  is_deactivated: boolean;
  deactivated_at: string | null;
  archived_at: string | null;
  archive_reason: string | null;
};

export type UserProfileDetails = {
  id: string;
  birthdate: string | null;
  about: string | null;
};

// ─── Fetch Profile ─────────────────────────────────────────
// Owner-only column set. This is safe only for the current authenticated user's row.
const PRIVATE_SELF_PROFILE_COLUMNS =
  'id, auth_user_id, username, first_name, last_name, email, phone_number, country_code, avatar_url, provider, role, role_id, created_at, updated_at, is_deactivated, deactivated_at, archived_at, archive_reason' as const;

async function normalizeOwnProfile(
  data: UserProfile | null
): Promise<UserProfile | null> {
  if (!data) return null;

  return {
    ...data,
    avatar_url: await resolveAvatarUrl(data.avatar_url),
  };
}

/** Pass auth.users id (JWT sub). Returns the current user's active private profile row, if any. */
const fetchOwnUserProfile = async (authUserId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select(PRIVATE_SELF_PROFILE_COLUMNS)
    .eq('auth_user_id', authUserId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return await normalizeOwnProfile({
    ...data,
    is_deactivated: data.is_deactivated ?? false,
    deactivated_at: data.deactivated_at ?? null,
    archived_at: data.archived_at ?? null,
    archive_reason: data.archive_reason ?? null,
  } as UserProfile);
};

// ─── useUserProfile Hook ───────────────────────────────────
export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userKeys.profile(user?.id ?? ''),
    queryFn: () => fetchOwnUserProfile(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5000,           // Consider data "stale" after 5 seconds
    refetchInterval: 10000,    // Hard-check every 10 seconds (Polling)
    refetchOnWindowFocus: true, // Re-check whenever the user comes back to the app
  });
}

// ─── useProfileCompletion Hook ─────────────────────────────
export function useProfileCompletion() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'completion'],
    queryFn: async () => {
      if (!user?.id) {
        return {
          isComplete: false,
          hasPhone: false,
          hasUsername: false,
          isArchived: false,
        };
      }

      const { data, error } = await supabase
        .from('users')
        .select('phone_number, username, archived_at')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const isArchived = data?.archived_at != null;
      const hasPhone = !!data?.phone_number;
      const hasUsername = !!data?.username;

      return {
        isComplete: hasPhone && hasUsername && !isArchived,
        hasPhone,
        hasUsername,
        isArchived,
      };
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, 
  });
}

// ─── useCheckUsername Hook ─────────────────────────────────
export function useCheckUsername(username: string) {
  return useQuery({
    queryKey: userKeys.username(username),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_username_availability', {
        p_username: username,
      });
      if (error) throw error;
      return data === true;
    },
    enabled: username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username),
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// ─── useUpdateProfile Mutation ─────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const {
        id: _id,
        auth_user_id: _authUserId,
        role,
        role_id,
        created_at,
        updated_at,
        is_deactivated,
        deactivated_at,
        archived_at,
        archive_reason,
        ...safeData
      } = profileData;

      const { data: existing, error: findErr } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user!.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existing?.id) {
        const { data: updated, error: upErr } = await supabase
          .from('users')
          .update(safeData)
          .eq('id', existing.id)
          .select(PRIVATE_SELF_PROFILE_COLUMNS)
          .single();
        if (upErr) throw upErr;
        return await normalizeOwnProfile(updated as UserProfile);
      }

      const { data: inserted, error: inErr } = await supabase
        .from('users')
        .insert({ ...safeData, auth_user_id: user!.id })
        .select(PRIVATE_SELF_PROFILE_COLUMNS)
        .single();
      if (inErr) throw inErr;
      return await normalizeOwnProfile(inserted as UserProfile);
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData(userKeys.profile(user.id), data);
        qc.setQueryData([...userKeys.profile(user.id), 'completion'], {
          isComplete: !!data?.phone_number && !!data?.username && data?.archived_at == null,
          hasPhone: !!data?.phone_number,
          hasUsername: !!data?.username,
          isArchived: data?.archived_at != null,
        });
      }
    },
  });
}

// ─── useUserProfileDetails Hooks ───────────────────────────
export function useUserProfileDetails() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'details'],
    queryFn: async () => {
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      if (!profileId) return null;
      const { data, error } = await supabase
        .from('user_profile_details')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfileDetails | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdateProfileDetails() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (details: Partial<UserProfileDetails>) => {
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      if (!profileId) throw new Error('No active profile');
      const { data, error } = await supabase
        .from('user_profile_details')
        .upsert({ ...details, id: profileId }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'details'], data);
      }
    },
  });
}
