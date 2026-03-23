import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveUsersRowIdForAuth, getAllUsersRowIdsForAuth, userKeys, UserProfile } from './profile';

export function useArchiveAccount() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      
      const activeId = await getActiveUsersRowIdForAuth(user.id);
      if (!activeId) throw new Error('No active account found to archive');

      const { data, error } = await supabase
        .from('users')
        .update({
          archived_at: new Date().toISOString(),
          archive_reason: 'user_self_service',
          is_deactivated: false,
          deactivated_at: null,
        })
        .eq('id', activeId)
        .select('id')
        .single();

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
      
      const activeId = await getActiveUsersRowIdForAuth(user.id);
      if (!activeId) throw new Error('No active account found to deactivate');

      const { error } = await supabase
        .from('users')
        .update({ is_deactivated: true })
        .eq('id', activeId);

      if (error) throw error;
    },
  });
}

const USER_PROFILE_COLUMNS =
  'id, auth_user_id, username, first_name, last_name, email, phone_number, country_code, avatar_url, provider, role, created_at, updated_at, is_deactivated, deactivated_at, archived_at, archive_reason' as const;

export function useReactivateAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not signed in');
      
      // We must identify the specific archived row to restore. 
      // Simply updating via auth_user_id could unarchive multiple historical rows.
      const { data: latestArchived, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) throw findError;
      if (!latestArchived) throw new Error('No archived account found to reactivate.');

      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_deactivated: false,
          deactivated_at: null,
          archived_at: null,
          archive_reason: null
        })
        .eq('id', latestArchived.id)
        .select(USER_PROFILE_COLUMNS)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: (data) => {
      if (user?.id) {
        const completionKey = [...userKeys.profile(user.id), 'completion'];

        // 1. Update the immediate profile cache
        qc.setQueryData(userKeys.profile(user.id), data);
        
        // 2. ⚡ INSTANT UPDATE: Patch the completion cache so the Router (app/_layout.tsx)
        // sees the change immediately without waiting for a network refetch.
        qc.setQueryData(completionKey, {
          isComplete: !!data?.phone_number && !!data?.username && data?.archived_at == null,
          hasPhone: !!data?.phone_number,
          hasUsername: !!data?.username,
          isArchived: data?.archived_at != null,
        });

        // 3. Fallback: Invalidate to ensure consistency with server eventually
        qc.invalidateQueries({ queryKey: completionKey });
      }
    },
  });
}

export function useRequestPhoneChangeCode() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // 🛡️ SECURITY: Use trusted email from the authenticated session.
      // We do NOT accept an email from the client to prevent cross-account OTP spam/abuse.
      if (!user?.email) throw new Error('Account email not found.');

      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) throw error;
      return true;
    },
  });
}

export function useChangePhoneNumber() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: { token: string; newPhone: string; countryCode: string }) => {
      // 🛡️ SECURITY: Use trusted email from the session for verification.
      if (!user?.email) throw new Error('Identity verification failed: Session expired.');
      
      const cleanEmail = user.email;

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: payload.token,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      const { data: result, error: rpcError } = await supabase.rpc('secure_phone_update', {
        p_email: cleanEmail,
        p_new_phone: payload.newPhone,
        p_country_code: payload.countryCode,
      });

      if (rpcError) throw rpcError;
      if (result.success === false) throw new Error(result.message);

      return result.data;
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: userKeys.profile(user.id) });
      }
    },
  });
}

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
          keys_header: meta?.keys_header,
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
