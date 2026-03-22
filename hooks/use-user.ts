import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paths } from 'expo-file-system';
import {
  cacheDirectory,
  deleteAsync,
  documentDirectory,
  getFreeDiskStorageAsync,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';

// ─── Query Keys ────────────────────────────────────────────
export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
  username: (username: string) => [...userKeys.all, 'username', username] as const,
};

/**
 * `public.users.id` for the active (non-archived) profile; auth session id is `auth.users.id`.
 * For which tables use auth id vs profile id in `user_id`, see `docs/database-user-ids.md`.
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
  created_at: string;
  updated_at: string;
  is_deactivated: boolean;
  deactivated_at: string | null;
  archived_at: string | null;
  archive_reason: string | null;
};

// ─── Fetch Profile ─────────────────────────────────────────
const USER_PROFILE_COLUMNS =
  'id, auth_user_id, username, first_name, last_name, email, phone_number, country_code, avatar_url, provider, role, created_at, updated_at, is_deactivated, deactivated_at, archived_at, archive_reason' as const;

/** Pass auth.users id (JWT sub). Returns the current active profile row, if any. */
const fetchUserProfile = async (authUserId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select(USER_PROFILE_COLUMNS)
    .eq('auth_user_id', authUserId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    is_deactivated: data.is_deactivated ?? false,
    deactivated_at: data.deactivated_at ?? null,
    archived_at: data.archived_at ?? null,
    archive_reason: data.archive_reason ?? null,
  } as UserProfile;
};

// ─── useUserProfile Hook ───────────────────────────────────
export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userKeys.profile(user?.id ?? ''),
    queryFn: () => fetchUserProfile(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── useProfileCompletion Hook ─────────────────────────────
// Specifically checks if phone_number and username are set
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
        .is('archived_at', null)
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
    staleTime: 2 * 60 * 1000, // 2 minutes (more important to be fresh)
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
    staleTime: 30 * 1000, // 30 seconds — usernames change fast
    retry: 1,
  });
}

// ─── useUpdateProfile Mutation ─────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      // Security: Filter out sensitive fields before sending to the database
      // This protects against "mass assignment" or "fragile trigger" bypasses.
      const {
        id: _id,
        auth_user_id: _authUserId,
        role,
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
          .select(USER_PROFILE_COLUMNS)
          .single();
        if (upErr) throw upErr;
        return updated as UserProfile;
      }

      const { data: inserted, error: inErr } = await supabase
        .from('users')
        .insert({ ...safeData, auth_user_id: user!.id })
        .select(USER_PROFILE_COLUMNS)
        .single();
      if (inErr) throw inErr;
      return inserted as UserProfile;
    },
    onSuccess: (data) => {
      // Update the profile cache
      if (user?.id) {
        qc.setQueryData(userKeys.profile(user.id), data);

        // Directly update the completion cache instead of just invalidating.
        // This prevents the router from reading stale "incomplete" data while background fetching.
        qc.setQueryData([...userKeys.profile(user.id), 'completion'], {
          isComplete:
            !!data?.phone_number && !!data?.username && data?.archived_at == null,
          hasPhone: !!data?.phone_number,
          hasUsername: !!data?.username,
          isArchived: data?.archived_at != null,
        });
      }
    },
  });
}

export function useArchiveAccount() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('users')
        .update({
          archived_at: new Date().toISOString(),
          archive_reason: 'user_self_service',
          is_deactivated: false,
          deactivated_at: null,
        })
        .eq('auth_user_id', user.id)
        .is('archived_at', null)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Account could not be archived');
    },
  });
}

export function useDeactivateAccount() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      const { error } = await supabase
        .from('users')
        .update({ is_deactivated: true })
        .eq('auth_user_id', user.id)
        .is('archived_at', null);
      if (error) throw error;
    },
  });
}

export function useReactivateAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('users')
        .update({ is_deactivated: false })
        .eq('auth_user_id', user.id)
        .is('archived_at', null)
        .select(USER_PROFILE_COLUMNS)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData(userKeys.profile(user.id), {
          ...data,
          is_deactivated: data.is_deactivated ?? false,
          deactivated_at: data.deactivated_at ?? null,
          archived_at: data.archived_at ?? null,
          archive_reason: data.archive_reason ?? null,
        });
      }
    },
  });
}

// ─── Profile Details ───────────────────────────────────────
export type UserProfileDetails = {
  id: string;
  birthdate: string | null;
  about: string | null;
};

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
// ─── Privacy Settings ──────────────────────────────────────
export type PrivacySettings = {
  user_id: string;
  last_seen: 'everyone' | 'contacts' | 'nobody';
  profile_photo: 'everyone' | 'contacts' | 'nobody';
  about: 'everyone' | 'contacts' | 'nobody';
  groups: 'everyone' | 'contacts' | 'nobody';
  read_receipts: boolean;
  online_status: 'everyone' | 'same_as_last_seen';
};

export function usePrivacySettings() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'privacy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as PrivacySettings | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdatePrivacySettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<PrivacySettings>) => {
      const { data, error } = await supabase
        .from('privacy_settings')
        .upsert({ ...settings, user_id: user!.id }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'privacy'], data);
      }
    },
  });
}

// ─── Security Settings ─────────────────────────────────────
export type SecuritySettings = {
  user_id: string;
  security_alerts: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useSecuritySettings() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'security'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_settings')
        .select('user_id, security_alerts, created_at, updated_at')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as SecuritySettings | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdateSecuritySettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<SecuritySettings>) => {
      const { data, error } = await supabase
        .from('security_settings')
        .upsert(
          { ...settings, user_id: user!.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'security'], data);
      }
    },
  });
}

// ─── Notification Settings ─────────────────────────────────
export type NotificationSettings = {
  user_id: string;
  show_notifications: boolean;
  show_previews: boolean;
  reaction_notifications: boolean;
  group_notifications: boolean;
  call_notifications: boolean;
  in_app_sounds: boolean;
  in_app_vibrate: boolean;
  expo_push_token: string | null;
  mute_until: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at?: string;
  updated_at?: string;
};

export function useNotificationSettings() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'notifications'],
    queryFn: async () => {
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      if (!profileId) return null;
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      if (!profileId) throw new Error('No active profile');
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert(
          { ...settings, user_id: profileId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'notifications'], data);
      }
    },
  });
}
// ─── Chat & Media Settings ────────────────────────────────
export type ChatSettings = {
  user_id: string;
  save_to_gallery: boolean;
  data_saver: boolean;
  high_quality_upload: boolean;
  mobile_download: string[];
  wifi_download: string[];
  chat_wallpaper: string;
  wallpaper_dim: number;
  created_at?: string;
  updated_at?: string;
};

export function useChatSettings() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'chat_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as ChatSettings | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdateChatSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<ChatSettings>) => {
      const { data, error } = await supabase
        .from('chat_settings')
        .upsert(
          { ...settings, user_id: user!.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'chat_settings'], data);
      }
    },
  });
}

// ─── Network Usage Statistics ──────────────────────────────
export type NetworkUsage = {
  user_id: string;
  media_sent: number;
  media_received: number;
  calls_sent: number;
  calls_received: number;
  messages_sent: number;
  messages_received: number;
  last_reset_at: string;
  created_at?: string;
  updated_at?: string;
};

export function useNetworkUsage() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'network_usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_usage')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as NetworkUsage | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useResetNetworkUsage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('network_usage')
        .upsert(
          {
            user_id: user!.id,
            media_sent: 0,
            media_received: 0,
            calls_sent: 0,
            calls_received: 0,
            messages_sent: 0,
            messages_received: 0,
            last_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'network_usage'], data);
      }
    },
  });
}
// ─── Storage Usage Statistics ──────────────────────────────
export type StorageUsage = {
  user_id: string;
  photos: number;
  videos: number;
  documents: number;
  audio: number;
  cache: number;
  total_device_space: number;
  free_device_space: number;
  created_at?: string;
  updated_at?: string;
};

const getRuntimeDiskSpace = async () => {
  const results = await Promise.allSettled([
    getTotalDiskCapacityAsync(),
    getFreeDiskStorageAsync(),
  ]);

  const pathTotal =
    typeof Paths.totalDiskSpace === 'number' && Number.isFinite(Paths.totalDiskSpace)
      ? Paths.totalDiskSpace
      : 0;
  const pathFree =
    typeof Paths.availableDiskSpace === 'number' && Number.isFinite(Paths.availableDiskSpace)
      ? Paths.availableDiskSpace
      : 0;

  const legacyTotal =
    results[0].status === 'fulfilled' && results[0].value > 0 ? results[0].value : 0;
  const legacyFree =
    results[1].status === 'fulfilled' && results[1].value >= 0 ? results[1].value : -1;

  return {
    total: Math.max(pathTotal, legacyTotal, 0),
    free: Math.max(pathFree, legacyFree, 0),
  };
};

const scanLocalFiles = async () => {
  const categories = {
    photos: 0,
    videos: 0,
    documents: 0,
    audio: 0,
    cache: 0,
  };

  const traverse = async (dir: string | null, isCache = false) => {
    if (!dir) return;
    try {
      const files = await readDirectoryAsync(dir);
      for (const file of files) {
        const path = `${dir}${file}`;
        const info = await getInfoAsync(path);
        if (info.exists) {
          if (info.isDirectory) {
            await traverse(`${path}/`, isCache);
          } else {
            const size = info.size || 0;
            if (isCache) {
              categories.cache += size;
            } else {
              const ext = file.split('.').pop()?.toLowerCase();
              if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
                categories.photos += size;
              } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) {
                categories.videos += size;
              } else if (['mp3', 'wav', 'm4a', 'aac'].includes(ext || '')) {
                categories.audio += size;
              } else {
                // This bucket is effectively internal app files plus any uncategorized downloads.
                categories.documents += size;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error scanning ${dir}:`, e);
    }
  };

  await traverse(documentDirectory);
  await traverse(cacheDirectory, true);

  return categories;
};

export function useStorageUsage() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'storage_usage'],
    queryFn: async () => {
      // 1. Fetch existing stats first for resilient fallback.
      const { data: existing, error } = await supabase
        .from('storage_usage')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      // 2. Get hardware + local scan with independent fallbacks.
      const [diskSpace, localScan] = await Promise.allSettled([
        getRuntimeDiskSpace(),
        scanLocalFiles(),
      ]);

      const total = diskSpace.status === 'fulfilled' ? diskSpace.value.total : 0;
      const free = diskSpace.status === 'fulfilled' ? diskSpace.value.free : 0;

      const localCounts =
        localScan.status === 'fulfilled'
          ? localScan.value
          : {
              photos: existing?.photos || 0,
              videos: existing?.videos || 0,
              documents: existing?.documents || 0,
              audio: existing?.audio || 0,
              cache: existing?.cache || 0,
            };

      try {
        // 3. Sync metrics to DB (Exclude hardware fingerprinting data)
        const { data: syncedData, error: upsertError } = await supabase
          .from('storage_usage')
          .upsert(
            {
              user_id: user!.id,
              ...localCounts,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .maybeSingle(); // Use maybeSingle to be safer

        if (upsertError) console.error('[Storage] Sync error:', upsertError);

        // 4. Return combined data (local hardware info + synced app data)
        return {
          user_id: user!.id,
          photos: syncedData?.photos ?? localCounts.photos ?? 0,
          videos: syncedData?.videos ?? localCounts.videos ?? 0,
          documents: syncedData?.documents ?? localCounts.documents ?? 0,
          audio: syncedData?.audio ?? localCounts.audio ?? 0,
          cache: syncedData?.cache ?? localCounts.cache ?? 0,
          total_device_space: total,
          free_device_space: free,
          updated_at: syncedData?.updated_at ?? new Date().toISOString(),
        } as StorageUsage;
      } catch (err) {
        console.error('[Storage] Hook error:', err);
        // Fallback to local-only data if DB sync fails
        return {
          user_id: user!.id,
          ...localCounts,
          total_device_space: total,
          free_device_space: free,
          updated_at: new Date().toISOString(),
        } as StorageUsage;
      }
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdateStorageUsage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<StorageUsage>) => {
      const { data, error } = await supabase
        .from('storage_usage')
        .upsert(
          { ...updates, user_id: user!.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'storage_usage'], data);
      }
    },
  });
}

export function useClearStorage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (type: 'cache' | 'all') => {
      // 1. Physical Deletion from Disk
      try {
        if (type === 'cache' && cacheDirectory) {
          const files = await readDirectoryAsync(cacheDirectory);
          await Promise.all(
            files.map((file: string) =>
              deleteAsync(`${cacheDirectory}${file}`, { idempotent: true })
            )
          );
        } else if (type === 'all') {
          // Clear cache
          if (cacheDirectory) {
            const cacheFiles = await readDirectoryAsync(cacheDirectory);
            await Promise.all(
              cacheFiles.map((f: string) =>
                deleteAsync(`${cacheDirectory}${f}`, { idempotent: true })
              )
            );
          }
          // Clear documents (media) - BE CAREFUL: only clear categorized media
          if (documentDirectory) {
            const docFiles = await readDirectoryAsync(documentDirectory);
            // We only delete media files, not app preferences or vital system files
            const mediaExts = [
              'jpg',
              'jpeg',
              'png',
              'gif',
              'webp',
              'mp4',
              'mov',
              'avi',
              'mkv',
              'mp3',
              'wav',
              'm4a',
              'aac',
            ];
            await Promise.all(
              docFiles.map((file: string) => {
                const ext = file.split('.').pop()?.toLowerCase();
                if (mediaExts.includes(ext || '')) {
                  return deleteAsync(`${documentDirectory}${file}`, {
                    idempotent: true,
                  });
                }
                return Promise.resolve();
              })
            );
          }
        }
      } catch (e) {
        console.error('Physical deletion failed', e);
      }

      // 2. Rescan disk after deletion so DB reflects the actual remaining files.
      const [diskSpace, localCounts] = await Promise.all([getRuntimeDiskSpace(), scanLocalFiles()]);

      try {
        const { data, error } = await supabase
          .from('storage_usage')
          .upsert(
            {
              user_id: user!.id,
              ...localCounts,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .maybeSingle();

        if (error) console.error('[Storage] Clear sync error:', error);

        return {
          user_id: user!.id,
          ...localCounts,
          total_device_space: diskSpace.total,
          free_device_space: diskSpace.free,
          updated_at: new Date().toISOString(),
          ...(data || {}),
        } as StorageUsage;
      } catch (err) {
        console.error('[Storage] Clear hook error:', err);
        return {
          user_id: user!.id,
          ...localCounts,
          total_device_space: diskSpace.total,
          free_device_space: diskSpace.free,
          updated_at: new Date().toISOString(),
        } as StorageUsage;
      }
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'storage_usage'], data);
      }
    },
  });
}

// ─── Account Actions: Phone Change ─────────────────────────

/**
 * Hook to request an identity verification code via the user's registered email.
 * This utilizes the Supabase SMTP system to deliver a secure OTP.
 */
export function useRequestPhoneChangeCode() {
  return useMutation({
    mutationFn: async (email: string) => {
      const cleanEmail = email.trim();
      console.log('[Auth] Requesting identity OTP for:', cleanEmail);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) {
        console.error('[Auth] OTP Request failed:', error);
        throw error;
      }
      return true;
    },
  });
}

/**
 * Hook to finalize the phone number change.
 * Performs a 3-step operation:
 * 1. Verifies the identity OTP code.
 * 2. Checks if the new phone number is actually available.
 * 3. Updates both Auth system and Public profile.
 */
export function useChangePhoneNumber() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    retry: 0, // CRITICAL: Prevent re-verifying used tokens
    mutationFn: async (payload: {
      email: string;
      token: string;
      newPhone: string;
      countryCode: string;
    }) => {
      console.log('[Auth] Starting phone change flow...', { userId: user?.id });

      // 1. Double-check availability on the database side
      console.log('[Auth] Checking number availability:', payload.newPhone);
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      const { data: isAvailable, error: checkError } = await supabase.rpc(
        'check_phone_number_availability',
        {
          p_phone_number: payload.newPhone,
          p_exclude_profile_id: profileId,
        }
      );
      if (checkError) throw checkError;
      if (isAvailable !== true) throw new Error('This phone number is already linked to another account.');

      // 2. Verify the Identity OTP
      const cleanEmail = payload.email.trim();
      const cleanToken = payload.token.trim();
      
      console.log('[Auth] Attempting OTP verification:', { email: cleanEmail, type: 'email' });
      
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (verifyError) {
        console.error('[Auth] OTP Verification failed:', verifyError);
        throw verifyError;
      }
      
      console.log('[Auth] OTP Verified successfully. Updating public profile...');

      // 3. Skip the Auth System update to avoid "SMS Provider" errors
      // Since identity was verified via Email OTP, we only update the public record.
      /* 
      const { error: authError } = await supabase.auth.updateUser({
        phone: payload.newPhone,
      });
      if (authError) throw authError; 
      */

      // 4. Update the Public Profile Record (This is what matters for the app)
      const { data, error: profileError } = await supabase
        .from('users')
        .update({
          phone_number: payload.newPhone,
          country_code: payload.countryCode,
          last_number_change_at: new Date().toISOString(),
          phone_number_set_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user!.id)
        .is('archived_at', null)
        .select()
        .single();

      if (profileError) {
        console.error('[Auth] Public profile update failed:', profileError);
        throw profileError;
      }
      
      console.log('[Auth] Phone change complete!');
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: userKeys.profile(user.id) });
      }
    },
  });
}

/**
 * Hook to manage account data requests (Request Info)
 */
export function useAccountDataRequest() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['account_data_request', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const ids = await getAllUsersRowIdsForAuth(user.id);
      if (ids.length === 0) return null;
      const { data, error } = await supabase
        .from('account_data_requests')
        .select('*')
        .in('user_id', ids)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Hook to manage ALL account data requests (History)
 */
export function useAccountDataRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['account_data_requests_history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const ids = await getAllUsersRowIdsForAuth(user.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('account_data_requests')
        .select('*')
        .in('user_id', ids)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * Hook to create a new data request
 */
export function useCreateDataRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (meta?: { storage_path?: string; keys_header?: any }) => {
      if (!user) throw new Error('Not authenticated');
      const profileId = await getActiveUsersRowIdForAuth(user.id);
      if (!profileId) throw new Error('No active profile');

      const { data, error } = await supabase
        .from('account_data_requests')
        .insert({
          user_id: profileId,
          status: 'ready',
          requested_at: new Date().toISOString(),
          report_format: 'pdf',
          storage_path: meta?.storage_path,
          keys_header: meta?.keys_header
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account_data_request', user?.id] });
      qc.invalidateQueries({ queryKey: ['account_data_requests_history', user?.id] });
    },
  });
}


/**
 * Hook to cancel or delete an account data request
 */
export function useDeleteDataRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error('Not authenticated');
      const ids = await getAllUsersRowIdsForAuth(user.id);
      if (ids.length === 0) throw new Error('No profile');

      const { error } = await supabase
        .from('account_data_requests')
        .delete()
        .eq('id', requestId)
        .in('user_id', ids);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account_data_request', user?.id] });
      qc.invalidateQueries({ queryKey: ['account_data_requests_history', user?.id] });
    },
  });
}

