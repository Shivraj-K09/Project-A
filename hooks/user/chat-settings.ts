import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userKeys } from './profile';

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
