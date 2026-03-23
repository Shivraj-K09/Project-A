import { useAuth } from '@/contexts/auth-context';
import { getActiveUsersRowIdForAuth } from '@/hooks/use-user';
import { SECURITY_CONFIG } from '@/lib/config';
import { CryptoHelper } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';
import { RecipientKey, SupportSession } from './types';

export function useSupportSession() {
  const { user } = useAuth();
  const [session, setSession] = useState<SupportSession | null>(null);
  const [recipientKeys, setRecipientKeys] = useState<RecipientKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const profileRowIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function init() {
      try {
        const profileId = await getActiveUsersRowIdForAuth(user!.id);
        profileRowIdRef.current = profileId;
        
        if (!profileId) {
          setIsLoading(false);
          return;
        }

        // Initialize E2EE Keys
        const pubKey = await CryptoHelper.initializeKeys();
        await supabase.from('users').update({ public_key: pubKey }).eq('id', profileId);

        // Fetch or Create Session
        let { data: sessionData } = await supabase
          .from('get_support_sessions')
          .select('*')
          .eq('user_id', profileId)
          .eq('status', 'active')
          .maybeSingle();

        if (!sessionData) {
          const { data: newSession } = await supabase
            .from('get_support_sessions')
            .insert({ user_id: profileId })
            .select()
            .single();
          sessionData = newSession;
        }

        if (!sessionData) throw new Error('Session creation failed');
        setSession(sessionData);

        // Setup Recipient Keys for E2EE
        const keys: RecipientKey[] = [
          { userId: user!.id, key: pubKey },
          { userId: SECURITY_CONFIG.AUDITOR_SLOT_ID, key: SECURITY_CONFIG.AUDITOR_PUBLIC_KEY },
        ];

        if (sessionData.agent_id) {
          const { data: agent } = await supabase
            .from('users')
            .select('public_key')
            .eq('id', sessionData.agent_id)
            .single();
          if (agent?.public_key) {
            keys.push({ userId: sessionData.agent_id, key: agent.public_key });
          }
        }

        setRecipientKeys(keys);
      } catch (err) {
        console.error('[Support Session] Init Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [user]);

  useEffect(() => {
    if (!session?.id) return;

    // SCALING RESOLUTION: Real-time recipient key sync
    // Detects when a new agent joins the chat while it is already open.
    const channel = supabase
      .channel(`session_updates:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'get_support_sessions',
          filter: `id=eq.${session.id}`,
        },
        async (payload) => {
          const updated = payload.new as SupportSession;
          if (updated.agent_id && updated.agent_id !== session.agent_id) {
             const { data: agent } = await supabase
              .from('users')
              .select('public_key')
              .eq('id', updated.agent_id)
              .single();
            
            if (agent?.public_key) {
               // Re-build keys with fresh agent
               const freshKeys: RecipientKey[] = [
                { userId: user!.id, key: (await CryptoHelper.initializeKeys()) }, // Me
                { userId: SECURITY_CONFIG.AUDITOR_SLOT_ID, key: SECURITY_CONFIG.AUDITOR_PUBLIC_KEY }, // Auditor
                { userId: updated.agent_id, key: agent.public_key } // New Agent
              ];
              setRecipientKeys(freshKeys);
              setSession(updated);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, user?.id]);

  const archiveSession = async () => {
    if (!session) return;
    await supabase.from('get_support_sessions').update({ status: 'archived' }).eq('id', session.id);
    await CryptoHelper.purgeKeys();
    setSession(null);
  };

  return { 
    session, 
    recipientKeys, 
    isLoading, 
    profileRowId: profileRowIdRef.current,
    archiveSession,
    setSession,
  };
}
