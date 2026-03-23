import { useAuth } from '@/contexts/auth-context';
import { CryptoHelper } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { encode } from 'base64-arraybuffer';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SupportMessage, SupportSession, RecipientKey } from './types';

export function useSupportMessages(
  session: SupportSession | null, 
  recipientKeys: RecipientKey[], 
  profileRowId: string | null
) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const keysCache = useRef<Record<string, string>>({});

  // 1. Initial Load
  const loadMessages = useCallback(async (sessionId: string, currentKeys: RecipientKey[]) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data && user) {
      const decrypted = await Promise.all(
        data.map((m) => decryptMessage(m, currentKeys, user.id))
      );
      setMessages(decrypted.filter(Boolean) as SupportMessage[]);
    }
  }, [user]);

  useEffect(() => {
    if (session?.id && recipientKeys.length > 0) {
      loadMessages(session.id, recipientKeys);
    }
  }, [session?.id, recipientKeys, loadMessages]);

  // 2. Real-time Subscription
  useEffect(() => {
    if (!session?.id || recipientKeys.length === 0 || !user) return;

    const channel = supabase
      .channel(`support_messages:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `session_id=eq.${session.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Optimistic UI Reconciliation
          if (newMsg.sender_id === profileRowId) {
            const tempId = newMsg.metadata?.temp_id;

            setMessages((prev) => {
              const matchIdx = tempId ? prev.findIndex((m) => m.id === tempId) : -1;
              const pendingIdx = matchIdx > -1 ? matchIdx : prev.findIndex((m) => m.status === 'pending');

              if (pendingIdx > -1) {
                const updated = [...prev];
                updated[pendingIdx] = {
                  ...updated[pendingIdx],
                  id: newMsg.id,
                  created_at: newMsg.created_at,
                  status: 'sent',
                };
                return updated;
              }
              return prev;
            });
            return;
          }

          const decrypted = await decryptMessage(newMsg, recipientKeys, user.id);
          if (decrypted) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === decrypted.id)) return prev;
              return [...prev, decrypted];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, recipientKeys, user, profileRowId]);

  // 3. Decryption Utility
  const decryptMessage = async (
    msg: any, 
    currentKeys: RecipientKey[], 
    currentUserId: string
  ): Promise<SupportMessage | null> => {
    try {
      const wrappedKey = msg.keys_header[currentUserId];
      if (!wrappedKey) return null;

      let senderKey = keysCache.current[msg.sender_id];
      if (!senderKey) {
        const { data: sender } = await supabase
          .from('users')
          .select('public_key')
          .eq('id', msg.sender_id)
          .single();
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
        const { data: blob } = await supabase.storage
          .from('support_attachments')
          .download(msg.attachment_path);

        if (blob) {
          const buffer = await blob.arrayBuffer();
          const decrypted = await CryptoHelper.decryptFile(buffer, wrappedKey, senderKey);
          const base64 = encode(decrypted);
          imageUrl = `data:image/jpeg;base64,${base64}`;
        }
      } else {
        text = await CryptoHelper.decrypt(msg.encrypted_blob, wrappedKey, senderKey);
      }

      return {
        id: msg.id,
        sender_id: msg.sender_id,
        text,
        created_at: msg.created_at,
        is_mine: msg.sender_id === profileRowId,
        status: 'sent',
        message_type: msg.message_type,
        attachment_path: msg.attachment_path,
        imageUrl,
      };
    } catch (err) {
      console.error('[Decrypt Message] Error:', err);
      return null;
    }
  };

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

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { blob, header } = await CryptoHelper.encrypt(text, recipientKeys);
      const { error } = await supabase
          .from('support_messages')
          .insert({
            session_id: session.id,
            sender_id: profileRowId,
            encrypted_blob: blob,
            keys_header: header,
            metadata: { temp_id: tempId },
          });

      if (error) throw error;
    } catch (err) {
      console.error('[Send Message] Error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [session, profileRowId, recipientKeys]);

  return { messages, setMessages, sendMessage };
}
