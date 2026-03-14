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

// ─── Types ─────────────────────────────────────────────────
export type UserProfile = {
  id: string;
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
};

// ─── Fetch Profile ─────────────────────────────────────────
const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

  if (error) throw error;
  return data;
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
      if (!user?.id) return { isComplete: false };

      const { data, error } = await supabase
        .from('users')
        .select('phone_number, username')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      return {
        isComplete: !!data?.phone_number && !!data?.username,
        hasPhone: !!data?.phone_number,
        hasUsername: !!data?.username,
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
      const { data, error } = await supabase
        .from('users')
        .upsert({ ...profileData, id: user!.id }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update the profile cache
      if (user?.id) {
        qc.setQueryData(userKeys.profile(user.id), data);

        // Directly update the completion cache instead of just invalidating.
        // This prevents the router from reading stale "incomplete" data while background fetching.
        qc.setQueryData([...userKeys.profile(user.id), 'completion'], {
          isComplete: !!data?.phone_number && !!data?.username,
          hasPhone: !!data?.phone_number,
          hasUsername: !!data?.username,
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
      const { data, error } = await supabase
        .from('user_profile_details')
        .select('*')
        .eq('id', user!.id)
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
      const { data, error } = await supabase
        .from('user_profile_details')
        .upsert({ ...details, id: user!.id }, { onConflict: 'id' })
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
  two_step_verification: boolean;
  is_pin_enabled: boolean;
  is_totp_enabled: boolean;
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
        .select(
          'user_id, security_alerts, two_step_verification, is_pin_enabled, is_totp_enabled, created_at, updated_at'
        )
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

export function useEnableSecurityPin() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pinPlain: string) => {
      const { data, error } = await supabase.rpc('enable_security_pin', {
        p_pin_plain: pinPlain,
      });

      if (error) throw error;
      return data as { success: boolean; backup_codes: string[] };
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: [...userKeys.profile(user.id), 'security'] });
      }
    },
  });
}

export function useVerifySecurityPin() {
  return useMutation({
    mutationFn: async (pinPlain: string) => {
      const { data, error } = await supabase.rpc('verify_security_pin', {
        p_pin_plain: pinPlain,
      });

      if (error) throw error;
      return data as boolean;
    },
  });
}

export function useDisableSecurity2FA() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('disable_security_2fa');
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: [...userKeys.profile(user.id), 'security'] });
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
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user!.id)
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
      const { data, error } = await supabase
        .from('notification_settings')
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

      // 3. Sync metrics to DB.
      const { data: syncedData, error: upsertError } = await supabase
        .from('storage_usage')
        .upsert(
          {
            user_id: user!.id,
            total_device_space: total,
            free_device_space: free,
            ...localCounts,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;
      return syncedData as StorageUsage;
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

      const { data, error } = await supabase
        .from('storage_usage')
        .upsert(
          {
            user_id: user!.id,
            total_device_space: diskSpace.total,
            free_device_space: diskSpace.free,
            ...localCounts,
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
        qc.setQueryData([...userKeys.profile(user.id), 'storage_usage'], data);
      }
    },
  });
}
