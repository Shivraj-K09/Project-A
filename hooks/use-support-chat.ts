import { useCallback } from 'react';
import { useSupportSession } from './support/use-support-session';
import { useSupportMessages } from './support/use-support-messages';
import { useSupportUpload } from './support/use-support-upload';
import { SupportMessage } from './support/types';

/**
 * ORCHESTRATOR HOOK
 * 
 * This hook coordinates the session, messaging, and upload logic for Support Chat.
 * It provides a unified API for the UI while remaining clean and maintainable.
 */
export function useSupportChat() {
  // 1. Manage Lifecycle & Keys
  const { 
    session, 
    recipientKeys, 
    isLoading, 
    profileRowId, 
    archiveSession 
  } = useSupportSession();

  // 2. Manage Real-time Messages & Decryption
  const { 
    messages, 
    setMessages, 
    sendMessage,
    isLoading: isMessagesLoading,
    isRecipientOnline
  } = useSupportMessages(session, recipientKeys, profileRowId);

  // 3. Manage File Attachments
  const handleOptimisticMessage = useCallback((msg: SupportMessage) => {
    setMessages((prev: SupportMessage[]) => [...prev, msg]);
  }, [setMessages]);

  const handleConfirmMessage = useCallback((tempId: string, serverId: string, createdAt: string) => {
    setMessages((prev: SupportMessage[]) =>
      prev.map((m: SupportMessage) =>
        m.id === tempId
          ? { ...m, id: serverId, created_at: createdAt, status: 'sent' }
          : m
      )
    );
  }, [setMessages]);

  const handleFailMessage = useCallback((tempId: string) => {
    setMessages((prev: SupportMessage[]) => prev.filter((m: SupportMessage) => m.id !== tempId));
  }, [setMessages]);

  const { sendImage } = useSupportUpload(
    session, 
    recipientKeys, 
    profileRowId,
    handleOptimisticMessage,
    handleConfirmMessage,
    handleFailMessage
  );

  // 4. Combined Actions
  const endChat = async () => {
    try {
      await archiveSession();
      setMessages([]);
    } catch (err) {
      if (__DEV__) console.error('[Support Chat] End Chat Orchestration Failed:', err);
    }
  };

  return { 
    messages, 
    sendMessage, 
    sendImage, 
    endChat, 
    isLoading: isLoading || isMessagesLoading, 
    session,
    isRecipientOnline
  };
}

export type { SupportMessage } from './support/types';
