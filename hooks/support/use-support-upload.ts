import { CryptoHelper } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback } from 'react';
import { SupportMessage, SupportSession, RecipientKey } from './types';

export function useSupportUpload(
  session: SupportSession | null, 
  recipientKeys: RecipientKey[], 
  profileRowId: string | null,
  onOptimisticMessage: (msg: SupportMessage) => void,
  onConfirmMessage: (tempId: string, serverId: string, createdAt: string) => void,
  onFailMessage: (tempId: string) => void
) {

  const sendImage = useCallback(async () => {
    if (!session || !profileRowId || recipientKeys.length === 0) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let uploadedPath: string | null = null;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const fileUri = result.assets[0].uri;

      // 1. Optimistic UI Notification
      const optimisticMsg: SupportMessage = {
        id: tempId,
        sender_id: profileRowId,
        text: 'Sent an image',
        created_at: new Date().toISOString(),
        is_mine: true,
        status: 'pending',
        message_type: 'image',
        imageUrl: fileUri,
      };
      onOptimisticMessage(optimisticMsg);

      // 2. Encrypt File Binary
      const { blob, header } = await CryptoHelper.encryptFile(fileUri, recipientKeys);

      // 3. Upload to Supabase Storage
      const fileName = `${session.id}/${tempId}.bin`;
      uploadedPath = fileName;
      const { error: uploadError } = await supabase.storage
        .from('support_attachments')
        .upload(fileName, blob, { contentType: 'application/octet-stream' });

      if (uploadError) throw uploadError;

      // 4. Save to Database
      const { data: newRow, error: dbError } = await supabase
        .from('support_messages')
        .insert({
          session_id: session.id,
          sender_id: profileRowId,
          encrypted_blob: '[ENCRYPTED_IMAGE]',
          keys_header: header,
          message_type: 'image',
          attachment_path: fileName,
          metadata: { temp_id: tempId },
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (newRow) {
        onConfirmMessage(tempId, newRow.id, newRow.created_at);
      }
    } catch (err) {
      if (__DEV__) console.error('[Send Image] Error:', err);

      // Roll back the uploaded encrypted blob if the message row was never created.
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from('support_attachments')
          .remove([uploadedPath]);

        if (__DEV__ && cleanupError) {
          console.warn('[Send Image] Cleanup Error:', cleanupError);
        }
      }

      onFailMessage(tempId);
    }
  }, [session, profileRowId, recipientKeys, onOptimisticMessage, onConfirmMessage, onFailMessage]);

  return { sendImage };
}
