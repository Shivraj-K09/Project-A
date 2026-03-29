import { useAuth } from '@/contexts/auth-context';
import { CryptoHelper } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { encode } from 'base64-arraybuffer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SupportMessage, SupportSession, RecipientKey } from './types';
import { applySupportReceiptStatuses } from './message-status';
import { markMessagesDelivered, markMessagesSeen } from './message-receipts';
import { SECURITY_CONFIG } from '@/lib/config';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useSupportMessages(
  session: SupportSession | null, 
  recipientKeys: RecipientKey[], 
  profileRowId: string | null
) {
  const qc = useQueryClient();
  const keysCache = useRef<Record<string, string>>({});
  const seenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocused = useIsFocused();
  
  // REAL-TIME STATE
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // 1. Decryption Utility (Memoized for useQuery)
  const decryptMessage = useCallback(async (
    msg: any, 
    currentUserId: string
  ): Promise<SupportMessage | null> => {
    try {
      let wrappedKey = msg.keys_header[currentUserId];
      if (!wrappedKey) wrappedKey = msg.keys_header[SECURITY_CONFIG.AUDITOR_SLOT_ID];
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
        id: msg.id,
        sender_id: msg.sender_id,
        text,
        created_at: msg.created_at,
        is_mine: msg.metadata?.is_system_greeting ? false : msg.sender_id === profileRowId,
        status: 'sent',
        message_type: msg.message_type,
        attachment_path: msg.attachment_path,
        imageUrl,
        delivered_at: msg.delivered_at,
        seen_at: msg.seen_at,
      };
    } catch (err) {
      return null;
    }
  }, [profileRowId]);

  // 2. TanStack Query for Dynamic Polling & Base State
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['support_messages', session?.id],
    queryFn: async () => {
      if (!session?.id || !profileRowId) return [];
      const { data } = await supabase.from('support_messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true });
      if (!data) return [];

      const inboundUndeliveredIds = data
        .filter((m) => m.sender_id !== profileRowId && !m.delivered_at)
        .map((m) => m.id);

      if (inboundUndeliveredIds.length > 0) await markMessagesDelivered(inboundUndeliveredIds);

      const decrypted = await Promise.all(data.map((m) => decryptMessage(m, profileRowId)));
      return applySupportReceiptStatuses(decrypted.filter(Boolean) as SupportMessage[]);
    },
    enabled: !!session?.id && !!profileRowId,
    refetchInterval: 5000,
  });

  // 3. REAL-TIME ENGINE
  useEffect(() => {
    if (!session?.id || !profileRowId) return;

    const pChannel = supabase.channel(`support_presence:${session.id}`, { config: { presence: { key: profileRowId } } });
    pChannel
      .on('presence', { event: 'sync' }, () => {
        const others = Object.keys(pChannel.presenceState()).filter(id => id !== profileRowId);
        setIsRecipientOnline(others.length > 0);
      })
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'support_messages', filter: `session_id=eq.${session.id}`
      }, async (payload) => {
        if (payload.new.sender_id !== profileRowId) {
          await markMessagesDelivered([payload.new.id]);
          qc.invalidateQueries({ queryKey: ['support_messages', session.id] });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await pChannel.track({ online_at: new Date().toISOString() });
      });

    return () => { void pChannel.unsubscribe(); };
  }, [session?.id, profileRowId, qc]);

  // 4. Seen Receipts Logic
  useEffect(() => {
    if (!isFocused) return;

    const unseenInboundIds = messages
      .filter((message) => !message.is_mine && !message.seen_at)
      .map((message) => message.id);

    if (unseenInboundIds.length === 0) return;

    seenTimerRef.current = setTimeout(() => {
      void markMessagesSeen(unseenInboundIds);
    }, 600);

    return () => {
      if (seenTimerRef.current) {
        clearTimeout(seenTimerRef.current);
        seenTimerRef.current = null;
      }
    };
  }, [isFocused, messages]);

  const setMessages = useCallback((updater: any) => {
    qc.setQueryData(['support_messages', session?.id], updater);
  }, [qc, session?.id]);

  // 5. Send Message with Optimistic UI
  const sendMessage = useCallback(async (text: string) => {
    if (!session || !profileRowId || recipientKeys.length === 0) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const optimisticMsg: SupportMessage = {
      id: tempId,
      sender_id: profileRowId,
      text: text,
      created_at: new Date().toISOString(),
      is_mine: true,
      status: 'pending',
    };

    setMessages((prev: SupportMessage[] = []) => [...prev, optimisticMsg]);

    try {
      const { blob, header } = await CryptoHelper.encrypt(text, recipientKeys);
      const { data, error } = await supabase
          .from('support_messages')
          .insert({
            session_id: session.id,
            sender_id: profileRowId,
            encrypted_blob: blob,
            keys_header: header,
            metadata: { temp_id: tempId },
          })
          .select()
          .single();

      if (error || !data) throw error || new Error('Insert failed');

      setMessages((prev: SupportMessage[] = []) => 
        prev.map(m => m.id === tempId ? { ...m, id: data.id, created_at: data.created_at, status: 'sent' } : m)
      );

    } catch (err) {
      if (__DEV__) console.error('[Send Message] Error:', err);
      setMessages((prev: SupportMessage[] = []) => prev.filter((m) => m.id !== tempId));
    }
  }, [session, profileRowId, recipientKeys, setMessages]);

  return { messages, setMessages, sendMessage, isLoading, isRecipientOnline };
}
