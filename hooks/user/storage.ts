import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cacheDirectory,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  getFreeDiskStorageAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';
import { userKeys } from './profile';

export type StorageUsage = {
  user_id: string;
  photos: number;
  videos: number;
  documents: number;
  audio: number;
  cache: number;
  total_device_space?: number;
  free_device_space?: number;
  updated_at: string;
};

const PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'mkv'];
const AUDIO_EXTS = ['mp3', 'wav', 'm4a', 'aac'];
const MEDIA_EXTS = [...PHOTO_EXTS, ...VIDEO_EXTS, ...AUDIO_EXTS];

const getRuntimeDiskSpace = async () => {
  try {
    const [total, free] = await Promise.all([
      getTotalDiskCapacityAsync(),
      getFreeDiskStorageAsync(),
    ]);
    return { total, free };
  } catch (err) {
    if (__DEV__) console.error('[Storage] Capacity check failed:', err);
    return { total: 0, free: 0 };
  }
};

/**
 * 🔒 Unified Storage Walker
 * Handles both scanning (calculating sizes) and recursive deletion.
 * Guaranteed consistent behavior across all storage actions.
 */
type WalkerOptions = {
  action: 'scan' | 'delete';
  isCache?: boolean;
  onlyMedia?: boolean;
  results?: {
    photos: number;
    videos: number;
    documents: number;
    audio: number;
    cache: number;
  };
};

const storageWalker = async (dir: string | null, options: WalkerOptions) => {
  if (!dir) return;

  try {
    const files = await readDirectoryAsync(dir).catch(() => []);
    
    // ⚡ CONCURRENCY THROTTLE
    // Unbounded fanning out via Promise.all(files.map(...)) can crash the app
    // or cause OS-level throttling on large directory trees. 
    // We process files in small, efficient chunks of 8.
    const CONCURRENCY_LIMIT = 8;
    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.all(
        chunk.map(async (file) => {
          const path = (dir.endsWith('/') ? dir : dir + '/') + file;
          const info = await getInfoAsync(path);
          
          if (info.exists) {
            if (info.isDirectory) {
              await storageWalker(path, options);
            } else {
              const ext = file.split('.').pop()?.toLowerCase() || '';
              const isMedia = MEDIA_EXTS.includes(ext);

              if (options.action === 'scan' && options.results) {
                const size = info.size || 0;
                if (options.isCache) {
                  options.results.cache += size;
                } else if (PHOTO_EXTS.includes(ext)) {
                  options.results.photos += size;
                } else if (VIDEO_EXTS.includes(ext)) {
                  options.results.videos += size;
                } else if (AUDIO_EXTS.includes(ext)) {
                  options.results.audio += size;
                } else {
                  options.results.documents += size;
                }
              } else if (options.action === 'delete') {
                if (!options.onlyMedia || isMedia) {
                  await deleteAsync(path, { idempotent: true });
                }
              }
            }
          }
        })
      );
    }
  } catch (e) {
    if (__DEV__) console.error(`[StorageWalker] Failed at ${dir}:`, e);
  }
};

const scanLocalFiles = async () => {
  const results = {
    photos: 0,
    videos: 0,
    documents: 0,
    audio: 0,
    cache: 0,
  };

  await Promise.all([
    storageWalker(documentDirectory, { action: 'scan', results }),
    storageWalker(cacheDirectory, { action: 'scan', isCache: true, results }),
  ]);

  return results;
};

export function useStorageUsage() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'storage_usage'],
    queryFn: async () => {
      const { data: existing, error } = await supabase
        .from('storage_usage')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      const [diskSpace, localCounts] = await Promise.all([
        getRuntimeDiskSpace(),
        scanLocalFiles(),
      ]);

      try {
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
          .maybeSingle();

        if (upsertError) {
          if (__DEV__) console.error('[Storage] Sync error:', upsertError);
        }

        return {
          user_id: user!.id,
          photos: syncedData?.photos ?? localCounts.photos ?? 0,
          videos: syncedData?.videos ?? localCounts.videos ?? 0,
          documents: syncedData?.documents ?? localCounts.documents ?? 0,
          audio: syncedData?.audio ?? localCounts.audio ?? 0,
          cache: syncedData?.cache ?? localCounts.cache ?? 0,
          total_device_space: diskSpace.total,
          free_device_space: diskSpace.free,
          updated_at: syncedData?.updated_at ?? new Date().toISOString(),
        } as StorageUsage;
      } catch (err) {
        return {
          user_id: user!.id,
          ...localCounts,
          total_device_space: diskSpace.total,
          free_device_space: diskSpace.free,
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
      try {
        if (type === 'cache') {
          await storageWalker(cacheDirectory, { action: 'delete' });
        } else if (type === 'all') {
          await Promise.all([
            storageWalker(cacheDirectory, { action: 'delete' }),
            storageWalker(documentDirectory, { action: 'delete', onlyMedia: true }),
          ]);
        }
      } catch (e) {
        if (__DEV__) console.error('Physical deletion failed', e);
      }

      const [diskSpace, localCounts] = await Promise.all([
        getRuntimeDiskSpace(),
        scanLocalFiles(),
      ]);

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

        if (error) {
          if (__DEV__) console.error('[Storage] Clear sync error:', error);
        }

        return {
          user_id: user!.id,
          ...localCounts,
          total_device_space: diskSpace.total,
          free_device_space: diskSpace.free,
          updated_at: new Date().toISOString(),
          ...(data || {}),
        } as StorageUsage;
      } catch (err) {
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
