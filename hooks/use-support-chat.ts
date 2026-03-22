import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { CryptoHelper } from '@/lib/crypto';
import { SECURITY_CONFIG } from '@/lib/config';
import { useAuth } from '@/contexts/auth-context';
import { getActiveUsersRowIdForAuth } from '@/hooks/use-user';
import * as DocumentPicker from 'expo-document-picker';
import { decode, encode } from 'base64-arraybuffer';

export interface SupportMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_mine: boolean;
  status?: 'pending' | 'sent' | 'error';
  message_type?: 'text' | 'image' | 'file';
  attachment_path?: string;
  imageUrl?: string; // Local preview or decrypted blob URL
}

export function useSupportChat() {
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientKeys, setRecipientKeys] = useState<{ userId: string, key: string }[]>([]);
  
  // Cache for public keys to avoid redundant DB hits during decryption
  const keysCache = useRef<Record<string, string>>({});
  const pendingMessages = useRef<Record<string, string>>({}); // text by tempId
  const profileRowIdRef = useRef<string | null>(null);

  // 1. Initialize Keys and Session
  useEffect(() => {
    if (!user) return;

    async function init() {
      try {
        if (!user) return;
        const profileId = await getActiveUsersRowIdForAuth(user.id);
        profileRowIdRef.current = profileId;
        if (!profileId) {
          setIsLoading(false);
          return;
        }

        const pubKey = await CryptoHelper.initializeKeys();
        keysCache.current[user.id] = pubKey;

        await supabase.from('users').update({ public_key: pubKey }).eq('id', profileId);

        let { data: sessions, error: fetchError } = await supabase
          .from('get_support_sessions')
          .select('*')
          .eq('user_id', profileId)
          .eq('status', 'active')
          .maybeSingle();

        if (!sessions) {
          const { data: newSession } = await supabase
            .from('get_support_sessions')
            .insert({ user_id: profileId })
            .select()
            .single();
          sessions = newSession;
        }

        if (!sessions) throw new Error('Failed to create session');
        setSession(sessions);

        const keys = [
          { userId: user.id, key: pubKey },
          { userId: SECURITY_CONFIG.AUDITOR_SLOT_ID, key: SECURITY_CONFIG.AUDITOR_PUBLIC_KEY }
        ];

        if (sessions?.agent_id) {
          const { data: agent } = await supabase.from('users').select('public_key').eq('id', sessions.agent_id).single();
          if (agent?.public_key) {
            keys.push({ userId: sessions.agent_id, key: agent.public_key });
            keysCache.current[sessions.agent_id] = agent.public_key;
          }
        }

        setRecipientKeys(keys);
        await loadMessages(sessions!.id, keys);
      } catch (err) {
        console.error('[Support] Init Failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [user]);

  // 2. Real-time Subscription
  useEffect(() => {
    if (!session?.id || recipientKeys.length === 0) return;

    const channel = supabase
      .channel(`support_messages:${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `session_id=eq.${session.id}` },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // SPEED OPTIMIZATION: If I sent this, I already have the 'text' locally.
          // This avoids the 'blink' caused by waiting for decryption.
          if (newMsg.sender_id === profileRowIdRef.current) {
            // Find any pending message that might match this new database record
            setMessages(prev => {
              const pendingIdx = prev.findIndex(m => m.status === 'pending');
              if (pendingIdx > -1) {
                const updated = [...prev];
                updated[pendingIdx] = {
                  ...updated[pendingIdx],
                  id: newMsg.id,
                  created_at: newMsg.created_at,
                  status: 'sent'
                };
                return updated;
              }
              // If not found in pending, decrypt normally
              return prev;
            });
            return;
          }

          const decrypted = await decryptMessage(newMsg, recipientKeys);
          if (decrypted) {
            setMessages(prev => {
              if (prev.find(m => m.id === decrypted.id)) return prev;
              return [...prev, decrypted];
            });
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'get_support_sessions', filter: `id=eq.${session.id}` }, 
        (payload: any) => {
          if (payload.new.status === 'archived') {
            setSession(null);
            setMessages([]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id, recipientKeys, user?.id]);

  const loadMessages = async (sessionId: string, currentKeys: any[]) => {
    const { data } = await supabase.from('support_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (data) {
      const decrypted = await Promise.all(data.map(m => decryptMessage(m, currentKeys)));
      setMessages(decrypted.filter(Boolean) as SupportMessage[]);
    }
  };

  const decryptMessage = async (msg: any, currentKeys: any[]): Promise<SupportMessage | null> => {
    try {
      if (!user) return null;
      const wrappedKey = msg.keys_header[user.id];
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
        text = " [Encrypted Image] ";
        // 1. Download encrypted blob
        const { data: blob, error } = await supabase.storage
          .from('support_attachments')
          .download(msg.attachment_path);
        
        if (blob) {
          // 2. Decrypt binary
          const buffer = await blob.arrayBuffer();
          const decrypted = await CryptoHelper.decryptFile(buffer, wrappedKey, senderKey);
          
          // 3. Convert to local URL for rendering
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
        is_mine: msg.sender_id === profileRowIdRef.current,
        status: 'sent',
        message_type: msg.message_type,
        attachment_path: msg.attachment_path,
        imageUrl
      };
    } catch (err) {
      console.error('[Support] Decrypt Failed:', err);
      return null;
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!session || !user || recipientKeys.length === 0) return;
    const pid = profileRowIdRef.current;
    if (!pid) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: SupportMessage = {
      id: tempId,
      sender_id: pid,
      text: text,
      created_at: new Date().toISOString(),
      is_mine: true,
      status: 'pending'
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { blob, header } = await CryptoHelper.encrypt(text, recipientKeys);
      const { data: newRow, error } = await supabase.from('support_messages').insert({
        session_id: session.id,
        sender_id: pid,
        encrypted_blob: blob,
        keys_header: header
      }).select().single();

      if (error) throw error;

      if (newRow) {
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...m,
          id: newRow.id,
          created_at: newRow.created_at,
          status: 'sent'
        } : m));
      }
    } catch (err) {
      console.error('[Support] Send Failed:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }, [session, user, recipientKeys]);

  const sendImage = useCallback(async () => {
    if (!session || !user || recipientKeys.length === 0) return;
    const pid = profileRowIdRef.current;
    if (!pid) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const fileUri = result.assets[0].uri;

      // 1. Optimistic UI
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: SupportMessage = {
        id: tempId,
        sender_id: pid,
        text: "Sent an image",
        created_at: new Date().toISOString(),
        is_mine: true,
        status: 'pending',
        message_type: 'image',
        imageUrl: fileUri
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // 2. Encrypt File Binary
      const { blob, header } = await CryptoHelper.encryptFile(fileUri, recipientKeys);

      // 3. Upload to Supabase Storage (Warehouse)
      const fileName = `${session.id}/${tempId}.bin`;
      const { error: uploadError } = await supabase.storage
        .from('support_attachments')
        .upload(fileName, blob, { contentType: 'application/octet-stream' });

      if (uploadError) throw uploadError;

      // 4. Save to Database (Ledger)
      const { data: newRow, error: dbError } = await supabase.from('support_messages').insert({
        session_id: session.id,
        sender_id: pid,
        encrypted_blob: '[ENCRYPTED_IMAGE]', // Placeholder for text search
        keys_header: header,
        message_type: 'image',
        attachment_path: fileName
      }).select().single();

      if (dbError) throw dbError;

      if (newRow) {
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...m,
          id: newRow.id,
          created_at: newRow.created_at,
          status: 'sent'
        } : m));
      }

    } catch (err) {
      console.error('[Support] Send Image Failed:', err);
    }
  }, [session, user, recipientKeys]);

  const endChat = useCallback(async () => {
    if (!session) return;
    try {
      const { error } = await supabase.from('get_support_sessions').update({ status: 'archived' }).eq('id', session.id);
      if (error) throw error;
      
      // Security: Purge the session keypair from hardware storage
      await CryptoHelper.purgeKeys();
      
      setSession(null);
      setMessages([]);
    } catch (err) {
      console.error('[Support] End Chat Failed:', err);
    }
  }, [session]);

  return { messages, sendMessage, sendImage, endChat, isLoading, session };
}
