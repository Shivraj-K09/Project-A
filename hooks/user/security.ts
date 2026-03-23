import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userKeys } from './profile';

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
