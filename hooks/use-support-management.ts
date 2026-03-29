import { useAuth } from '@/contexts/auth-context';
import { resolveAvatarUrl } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { SupporterInboxItem } from './support/types';

/**
 * 🛠️ SUPPORTER DASHBOARD HOOK
 * 
 * Fetches and polls all active/pending support sessions.
 */
export function useSupportManagement() {
  const { user } = useAuth();

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['support_sessions_inbox'],
    queryFn: async () => {
      // 1. Fetch Sessions with User Details
      const { data: sessions, error } = await supabase
        .from('get_support_sessions')
        .select(`
          *,
          user:user_id (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // 2. Transformed: Show status-aware messages
      return await Promise.all((sessions || []).map(async (s: any) => {
        let lastMsg = 'New help request pending...';
        if (s.status === 'active') lastMsg = 'Support session active...';
        if (s.status === 'archived') lastMsg = 'Conversation archived.';

        const safeUser = s.user ?? {
          id: s.user_id,
          username: null,
          first_name: null,
          last_name: null,
          avatar_url: null,
        };
        const name = safeUser.first_name
          ? `${safeUser.first_name} ${safeUser.last_name || ''}`.trim()
          : (safeUser.username || 'Restricted Profile');

        return {
          id: s.id,
          user: {
            ...safeUser,
            avatar_url: await resolveAvatarUrl(safeUser.avatar_url),
            name,
          },
          lastMessage: lastMsg,
          timestamp: s.updated_at,
          status: s.status,
          agent_id: s.agent_id
        } as SupporterInboxItem;
      }));
    },
    enabled: !!user,
    refetchInterval: 5000, // 🔄 Smooth polling for dashboard
  });

  // Calculate stats from tickets
  const stats = {
    active: tickets.filter(t => t.status === 'active').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    archived: tickets.filter(t => t.status === 'archived').length
  };

  return { tickets, stats, isLoading, refetch };
}

export type { SupporterInboxItem } from './support/types';
