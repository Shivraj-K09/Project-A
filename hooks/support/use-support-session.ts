import { useAuth } from '@/contexts/auth-context';
import { getActiveUsersRowIdForAuth } from '@/hooks/use-user';
import { SECURITY_CONFIG } from '@/lib/config';
import { CryptoHelper } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RecipientKey, SupportSession } from './types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useSupportSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [recipientKeys, setRecipientKeys] = useState<RecipientKey[]>([]);
  const activeChannelIdRef = useRef<string | null>(null);

  // 1. IDENTITY QUERY
  const { data: profileId } = useQuery({
    queryKey: ['user_profile_id', user?.id],
    queryFn: () => getActiveUsersRowIdForAuth(user!.id),
    enabled: !!user,
    staleTime: Infinity,
  });

  // 2. SESSION QUERY (Active only)
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['support_session_active', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      let { data: sessionData } = await supabase.from('get_support_sessions').select('*').eq('user_id', profileId).eq('status', 'active').maybeSingle();
      
      if (!sessionData) {
        // A. Create Session
        const { data: newSession } = await supabase.from('get_support_sessions').insert({ user_id: profileId }).select().single();
        if (!newSession) return null;

        // B. WARM UP GREETING (Save to DB once session is created)
        try {
          // We need the user's key to encrypt the greeting for them
          const key = await CryptoHelper.initializeKeys();
          const keys: RecipientKey[] = [
            { userId: profileId, key: key },
            { userId: SECURITY_CONFIG.AUDITOR_SLOT_ID, key: SECURITY_CONFIG.AUDITOR_PUBLIC_KEY },
          ];

          const greeting = "How can we help today? Our security team is ready to assist in this E2EE tunnel.";
          const { blob, header } = await CryptoHelper.encrypt(greeting, keys);
          
          await supabase.from('support_messages').insert({
            session_id: newSession.id,
            sender_id: profileId, // As fallback, we label it in UI
            encrypted_blob: blob,
            keys_header: header,
            metadata: { is_system_greeting: true }
          });
        } catch (err) {}
        
        sessionData = newSession;
      }
      return sessionData as SupportSession;
    },
    enabled: !!profileId,
  });

  // 3. CRYPTO KEYS PREPARATION (Persistent Warm-up)
  useQuery({
    queryKey: ['user_public_key', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const key = await CryptoHelper.initializeKeys();
      await supabase.from('users').update({ public_key: key }).eq('id', profileId);
      return key;
    },
    enabled: !!profileId,
    staleTime: Infinity,
  });
  
  // Expose the public key separately for immediate encryption use if needed
  const { data: pubKey } = useQuery({
    queryKey: ['user_pub_key_derived', profileId],
    queryFn: () => CryptoHelper.initializeKeys(),
    enabled: !!profileId,
    staleTime: Infinity,
  });

  // 4. RECIPIENT KEYS (Depends on session and agent)
  useEffect(() => {
    if (!profileId || !pubKey || !session) return;
    
    const keys: RecipientKey[] = [
      { userId: profileId, key: pubKey },
      { userId: SECURITY_CONFIG.AUDITOR_SLOT_ID, key: SECURITY_CONFIG.AUDITOR_PUBLIC_KEY },
    ];
    
    if (session.agent_id) {
      supabase.from('users').select('public_key').eq('id', session.agent_id).single()
        .then(({ data: agent }) => {
          if (agent?.public_key) {
            setRecipientKeys([...keys, { userId: session.agent_id!, key: agent.public_key }]);
          } else {
            setRecipientKeys(keys);
          }
        });
    } else {
      setRecipientKeys(keys);
    }
  }, [profileId, pubKey, session?.id, session?.agent_id]);

  // 5. MASS RE-KEYING LOGIC
  const performMassReKey = useCallback(async (agentId: string, agentPubKey: string) => {
    if (!profileId || !session?.id) return;
    try {
      const { data: history } = await supabase.from('support_messages').select('*').eq('session_id', session.id);
      if (!history || history.length === 0) return;
      
      const myKeys = await CryptoHelper.initializeKeys();
      const senderKeysCache: Record<string, string> = { [profileId]: myKeys };

      await Promise.all(history.map(async (msg) => {
        if (msg.keys_header[agentId]) return;
        const myWrappedKey = msg.keys_header[profileId];
        if (!myWrappedKey) return;

        try {
          let senderPubKey = senderKeysCache[msg.sender_id];
          if (!senderPubKey) {
            const { data: sender } = await supabase.from('users').select('public_key').eq('id', msg.sender_id).single();
            if (sender?.public_key) {
              senderPubKey = sender.public_key;
              senderKeysCache[msg.sender_id] = senderPubKey;
            }
          }
          if (!senderPubKey) return;

          const rawKey = await CryptoHelper.unwrapSessionKey(myWrappedKey, senderPubKey);
          const agentWrappedKey = await CryptoHelper.wrapSessionKey(rawKey, agentPubKey);
          const newHeader = { ...msg.keys_header, [agentId]: agentWrappedKey };
          await supabase.from('support_messages').update({ keys_header: newHeader }).eq('id', msg.id);
        } catch (inner) {}
      }));
    } catch (err) {}
  }, [profileId, session?.id]);

  // 6. REAL-TIME CHANNEL
  useEffect(() => {
    if (!session?.id || !profileId) return;
    if (activeChannelIdRef.current === session.id) return;
    activeChannelIdRef.current = session.id;

    const channel = supabase.channel(`support_session:${session.id}`, { config: { broadcast: { ack: true } } });
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'get_support_sessions', filter: `id=eq.${session.id}` }, async (payload) => {
        const updated = payload.new as SupportSession;
        if (updated.agent_id && updated.agent_id !== session.agent_id) {
           qc.setQueryData(['support_session_active', profileId], updated);
           const { data: agent } = await supabase.from('users').select('public_key').eq('id', updated.agent_id).single();
           if (agent?.public_key) await performMassReKey(updated.agent_id, agent.public_key);
        }
      })
      .on('broadcast', { event: 'agent_join' }, async ({ payload }) => {
        if (!payload.agentId || !session.id) return;
        if (!session.agent_id) {
          await supabase.from('get_support_sessions').update({ agent_id: payload.agentId, status: 'active' }).eq('id', session.id);
        }
        const { data: agent } = await supabase.from('users').select('public_key').eq('id', payload.agentId).single();
        if (agent?.public_key) {
          await performMassReKey(payload.agentId, agent.public_key);
          await channel.send({ type: 'broadcast', event: 'history_unlocked', payload: { sessionId: session.id, agentId: payload.agentId } });
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      activeChannelIdRef.current = null;
    };
  }, [session?.id, session?.agent_id, profileId, performMassReKey, qc]);

  const archiveSession = async () => {
    if (!session) return;
    await supabase.from('get_support_sessions').update({ status: 'archived' }).eq('id', session.id);
    await CryptoHelper.purgeKeys();
    qc.setQueryData(['support_session_active', profileId], null);
  };

  return { 
    session: session || null, 
    recipientKeys, 
    isLoading: isSessionLoading || !profileId, 
    profileRowId: profileId || null,
    archiveSession,
  };
}


