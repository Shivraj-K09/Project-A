import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveUsersRowIdForAuth, getAllUsersRowIdsForAuth } from './profile';
import { CryptoHelper } from '@/lib/crypto';
import { AccountReportData, generateReportHTML } from '@/components/account/report-template';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';

export function useAccountReport() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ brandColor, requestId }: { brandColor: string; requestId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const activeProfileId = await getActiveUsersRowIdForAuth(user.id);
      const allProfileIds = await getAllUsersRowIdsForAuth(user.id);
      
      if (!activeProfileId) {
        throw new Error('No active profile to export');
      }

      // 1. Fetch all relevant data in parallel
      const [
        { data: profile },
        { data: privacy },
        { data: notification },
        { data: chat },
        { data: network },
        { data: storage },
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', activeProfileId).single(),
        supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('notification_settings').select('*').eq('user_id', activeProfileId).single(),
        supabase.from('chat_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('network_usage').select('*').eq('user_id', user.id).single(),
        supabase.from('storage_usage').select('*').eq('user_id', user.id).single(),
      ]);

      // 2. Decrypt Support Chat History (Paginated & Capped for Scaling)
      const { data: userSessions } = await supabase
        .from('get_support_sessions')
        .select('id')
        .in('user_id', allProfileIds.length > 0 ? allProfileIds : [activeProfileId]);

      const sessionIds = userSessions?.map((s) => s.id) || [];
      const decryptedMessages: any[] = [];

      if (sessionIds.length > 0) {
        let hasMore = true;
        let page = 0;
        const BATCH_SIZE = 100;
        const MAX_BATCHES = 5; // 🛡️ Safety Cap: 500 total messages in PDF

        await CryptoHelper.initializeKeys();

        while (hasMore && page < MAX_BATCHES) {
          const start = page * BATCH_SIZE;
          const end = start + BATCH_SIZE - 1;

          const { data: rawMessages, error: msgError } = await supabase
            .from('support_messages')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true })
            .range(start, end);

          if (msgError || !rawMessages || rawMessages.length === 0) {
            hasMore = false;
            break;
          }

          // SCALING RESOLUTION: Bulk fetch sender keys to avoid N+1 query
          const uniqueSenderIds = [...new Set(rawMessages.map((m: any) => m.sender_id))];
          const { data: senderKeys } = await supabase
            .from('users')
            .select('id, public_key')
            .in('id', uniqueSenderIds);
          
          const keyMap = new Map<string, string>();
          senderKeys?.forEach(s => {
            if (s.public_key) keyMap.set(s.id, s.public_key);
          });

          const batch = await Promise.all(
            rawMessages.map(async (m: any) => {
              try {
                const wrappedKey = m.keys_header?.[user.id];
                if (!wrappedKey) return null;

                const senderPublicKey = keyMap.get(m.sender_id);
                if (!senderPublicKey) {
                   // Fallback: If not in bulk (rare), skip or fetch once
                   return null;
                }

                const text = m.message_type === 'image'
                    ? '[Image Attachment]'
                    : await CryptoHelper.decrypt(m.encrypted_blob, wrappedKey, senderPublicKey);

                return {
                  text,
                  created_at: m.created_at,
                  is_mine: allProfileIds.includes(m.sender_id),
                };
              } catch (decError) {
                return {
                  text: '[Encrypted Message]',
                  created_at: m.created_at,
                  is_mine: allProfileIds.includes(m.sender_id),
                };
              }
            })
          );

          decryptedMessages.push(...batch.filter(Boolean));
          
          if (rawMessages.length < BATCH_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }

      const reportData: AccountReportData = {
        profile: profile as any,
        privacy: privacy as any,
        notification,
        chat,
        network: network as any,
        storage,
        messages: decryptedMessages.filter(Boolean),
      };

      // 3. Generate HTML and PDF
      const html = generateReportHTML(reportData, brandColor, requestId);
      const { uri: localUri } = await Print.printToFileAsync({ html });

      // 4. Handle Platform-Specific Download / Share
      if (Platform.OS === 'android') {
        const saf = (FileSystem as any).StorageAccessFramework;
        const encodingBase64 = (FileSystem as any).EncodingType?.Base64 || 'base64';

        if (saf) {
          const permissions = await saf.requestDirectoryPermissionsAsync();

          if (permissions.granted) {
            const base64 = await FileSystem.readAsStringAsync(localUri, {
              encoding: encodingBase64,
            });
            const fileName = `social-media-report-${dayjs().format('YYYY-MM-DD-HHmm')}.pdf`;

            await saf.createFileAsync(
              permissions.directoryUri,
              fileName,
              'application/pdf',
              base64
            );
            return { success: true, method: 'save' };
          }
        }
      }

      // Default fallback for iOS or if Android SAF fails/cancelled
      await shareAsync(localUri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return { success: true, method: 'share' };
    },
  });
}
