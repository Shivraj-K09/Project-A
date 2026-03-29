import { useAuth } from '@/contexts/auth-context';
import { CryptoHelper } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SupportMessage, SupportSession, RecipientKey, SupporterInboxItem } from './support/types';
import { SECURITY_CONFIG } from '@/lib/config';
import { getActiveUsersRowIdForAuth } from './use-user';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupportUpload } from './support/use-support-upload';
import { encode } from 'base64-arraybuffer';
import { applySupportReceiptStatuses } from './support/message-status';
import { markMessagesDelivered, markMessagesSeen } from './support/message-receipts';
import { useIsFocused } from '@react-navigation/native';

// GLOBAL CACHE FOR WARM BOOT
let globalProfileId: string | null = null;
let globalPubKey: string | null = null;

/**
 * SUPPORTER CHAT ORCHESTRATOR
 */
export function useSupporterChat(sessionId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const keysCache = useRef<Record<string, string>>({});
  const seenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocused = useIsFocused();
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);

  // 1. IDENTITY & SESSION QUERIES (Instant Cache Access)
  const { data: profileId } = useQuery({
    queryKey: ['supporter_profile_id', user?.id],
    queryFn: async () => {
      if (globalProfileId) return globalProfileId;
      const pid = await getActiveUsersRowIdForAuth(user!.id);
      globalProfileId = pid;
      return pid;
    },
    enabled: !!user,
    staleTime: Infinity,
    initialData: () => globalProfileId || undefined,
  });

  const { data: sessionData } = useQuery({
    queryKey: ['support_session', sessionId],
    queryFn: async () => {
      const { data } = await supabase.from('get_support_sessions').select('*').eq('id', sessionId).single();
      return data as SupportSession;
    },
    enabled: !!sessionId,
    // 🔥 INSTANT: Pull from inbox list cache if possible
    initialData: () => {
      const inboxItems = qc.getQueryData<SupporterInboxItem[]>(['support_sessions_inbox']);
      const match = inboxItems?.find(t => t.id === sessionId);
      if (match) {
        return {
          id: match.id,
          user_id: match.user.id,
          status: match.status,
          agent_id: match.agent_id,
          created_at: match.timestamp, // approximate
          updated_at: match.timestamp
        } as SupportSession;
      }
      return undefined;
    }
  });

  // 2. CRYPTO CONTEXT (Parallelized and cached)
  const { data: cryptoContext } = useQuery({
    queryKey: ['supporter_crypto_context', sessionId, profileId, sessionData?.user_id],
    queryFn: async () => {
      if (!profileId || !sessionData) return null;
      
      if (!globalPubKey) {
        globalPubKey = await CryptoHelper.initializeKeys();
      }
      const myPubKey = globalPubKey;
      
      const { data: userRow } = await supabase.from('users').select('public_key').eq('id', sessionData.user_id).single();
      
      const keys: RecipientKey[] = [
        { userId: profileId, key: myPubKey },
        { userId: SECURITY_CONFIG.AUDITOR_SLOT_ID, key: SECURITY_CONFIG.AUDITOR_PUBLIC_KEY },
      ];
      if (userRow?.public_key) keys.push({ userId: sessionData.user_id, key: userRow.public_key });
      
      return { profileId, keys };
    },
    enabled: !!profileId && !!sessionData,
    staleTime: 5 * 60 * 1000,
  });

  // 3. MESSAGES ENGINE
  const decryptMessage = useCallback(async (msg: any, currentUserId: string): Promise<SupportMessage | null> => {
    try {
      let wrappedKey = msg.keys_header[currentUserId] || msg.keys_header[SECURITY_CONFIG.AUDITOR_SLOT_ID];
      if (!wrappedKey) return null;

      let senderKey = keysCache.current[msg.sender_id];
      if (!senderKey) {
        const { data: sender } = await supabase.from('users').select('public_key').eq('id', msg.sender_id).single();
        if (sender?.public_key) {
           senderKey = sender.public_key;
           keysCache.current[msg.sender_id] = senderKey;
        }
      }
      if (!senderKey) return null;

      let text = '';
      let imageUrl = '';
      if (msg.message_type === 'image' && msg.attachment_path) {
        text = ' [Encrypted Image] ';
        const { data: blob } = await supabase.storage.from('support_attachments').download(msg.attachment_path);
        if (blob) {
          const buffer = await blob.arrayBuffer();
          const decrypted = await CryptoHelper.decryptFile(buffer, wrappedKey, senderKey);
          imageUrl = `data:image/jpeg;base64,${encode(decrypted)}`;
        }
      } else {
        text = await CryptoHelper.decrypt(msg.encrypted_blob, wrappedKey, senderKey);
      }

      return {
        id: msg.id, sender_id: msg.sender_id, text, created_at: msg.created_at,
        is_mine: msg.metadata?.is_system_greeting ? false : msg.sender_id === currentUserId, 
        status: 'sent',
        message_type: msg.message_type, attachment_path: msg.attachment_path,
        imageUrl, delivered_at: msg.delivered_at, seen_at: msg.seen_at,
      } as SupportMessage;
    } catch (err) { return null; }
  }, []);

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['supporter_messages', sessionId],
    queryFn: async () => {
      const { data } = await supabase.from('support_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (!data || !cryptoContext) return [];
      
      const inboundUndeliveredIds = data
        .filter((m) => m.sender_id !== cryptoContext.profileId && !m.delivered_at)
        .map((m) => m.id);

      if (inboundUndeliveredIds.length > 0) await markMessagesDelivered(inboundUndeliveredIds);

      const decrypted = await Promise.all(data.map(m => decryptMessage(m, cryptoContext.profileId)));
      return applySupportReceiptStatuses(decrypted.filter(Boolean) as SupportMessage[]);
    },
    enabled: !!cryptoContext, // Stays enabled only when context exists
    refetchInterval: 5000, 
  });

  // 4. REAL-TIME ENGINE
  useEffect(() => {
    if (!sessionId || !profileId) return;

    const pChannel = supabase.channel(`support_presence:${sessionId}`, { config: { presence: { key: profileId } } });
    pChannel
      .on('presence', { event: 'sync' }, () => {
        const others = Object.keys(pChannel.presenceState()).filter(id => id !== profileId);
        setIsRecipientOnline(others.length > 0);
      })
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'support_messages', 
        filter: `session_id=eq.${sessionId}` 
      }, async (payload) => {
        if (payload.new.sender_id !== profileId) {
          await markMessagesDelivered([payload.new.id]);
          qc.invalidateQueries({ queryKey: ['supporter_messages', sessionId] });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await pChannel.track({ online_at: new Date().toISOString() });
          if (sessionData && !sessionData.agent_id) {
             const { data: claimed } = await supabase.from('get_support_sessions')
              .update({ agent_id: profileId, status: 'active' })
              .eq('id', sessionId).is('agent_id', null).select().single();
             if (claimed) qc.setQueryData(['support_session', sessionId], claimed);
          }
        }
      });

    return () => { void pChannel.unsubscribe(); };
  }, [sessionId, profileId, sessionData?.agent_id, qc]);

  // 5. SEEN LOGIC
  useEffect(() => {
    if (!isFocused || messages.length === 0) return;
    const unseenIds = messages.filter((m) => !m.is_mine && !m.seen_at).map((m) => m.id);
    if (unseenIds.length > 0) {
      seenTimerRef.current = setTimeout(() => { void markMessagesSeen(unseenIds); }, 600);
    }
    return () => { if (seenTimerRef.current) clearTimeout(seenTimerRef.current); };
  }, [isFocused, messages]);

  // 6. ACTIONS
  const handleOptimistic = useCallback((msg: SupportMessage) => {
    qc.setQueryData(['supporter_messages', sessionId], (old: SupportMessage[] = []) => [...old, msg]);
  }, [qc, sessionId]);

  const { sendImage } = useSupportUpload(
    sessionData || null, cryptoContext?.keys || [], cryptoContext?.profileId || null,
    handleOptimistic,
    (tempId, serverId, createdAt) => {
      qc.setQueryData(['supporter_messages', sessionId], (old: SupportMessage[] = []) =>
        old.map(m => m.id === tempId ? { ...m, id: serverId, created_at: createdAt, status: 'sent' } : m)
      );
    },
    (tempId) => {
      qc.setQueryData(['supporter_messages', sessionId], (old: SupportMessage[] = []) => old.filter(m => m.id !== tempId));
    }
  );

  const sendMessage = async (text: string) => {
    if (!sessionData || !cryptoContext || sessionData.status === 'archived') return;
    const tempId = `temp-${Date.now()}`;
    handleOptimistic({ id: tempId, sender_id: cryptoContext.profileId, text, created_at: new Date().toISOString(), is_mine: true, status: 'pending' } as any);
    try {
      const { blob, header } = await CryptoHelper.encrypt(text, cryptoContext.keys);
      const { data, error } = await supabase.from('support_messages').insert({
        session_id: sessionId, sender_id: cryptoContext.profileId, encrypted_blob: blob, keys_header: header, metadata: { temp_id: tempId }
      }).select().single();
      if (error || !data) throw error;
      qc.setQueryData(['supporter_messages', sessionId], (old: SupportMessage[] = []) =>
        old.map(m => m.id === tempId ? { ...m, id: data.id, created_at: data.created_at, status: 'sent' } : m)
      );
    } catch (err) {
      qc.setQueryData(['supporter_messages', sessionId], (old: SupportMessage[] = []) => old.filter(m => m.id !== tempId));
    }
  };

  const endChat = async () => {
    if (!sessionId) return;
    try {
      await supabase.from('get_support_sessions').update({ status: 'archived' }).eq('id', sessionId);
      qc.setQueryData(['support_session', sessionId], (prev: any) => prev ? { ...prev, status: 'archived' } : null);
      qc.invalidateQueries({ queryKey: ['supporter_messages', sessionId] });
    } catch (err) {}
  };

  return { 
    messages, sendMessage, sendImage, endChat, 
    isLoading: isMessagesLoading, 
    session: sessionData || null, 
    isRecipientOnline 
  };
}


