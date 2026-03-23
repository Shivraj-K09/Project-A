import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userKeys } from './profile';

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
        .update({
          media_sent: 0,
          media_received: 0,
          calls_sent: 0,
          calls_received: 0,
          messages_sent: 0,
          messages_received: 0,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id)
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
