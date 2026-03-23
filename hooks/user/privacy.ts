import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userKeys } from './profile';

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
