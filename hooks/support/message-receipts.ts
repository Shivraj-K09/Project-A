import { supabase } from '@/lib/supabase';

export async function markMessagesDelivered(messageIds: string[]) {
  if (messageIds.length === 0) return;

  const timestamp = new Date().toISOString();

  const { error } = await supabase
    .from('support_messages')
    .update({ delivered_at: timestamp })
    .in('id', messageIds)
    .is('delivered_at', null);

  if (error && __DEV__) {
    console.warn('[Support Receipts] Failed to mark delivered:', error.message);
  }
}

export async function markMessagesSeen(messageIds: string[]) {
  if (messageIds.length === 0) return;

  const timestamp = new Date().toISOString();

  const { error } = await supabase
    .from('support_messages')
    .update({ seen_at: timestamp })
    .in('id', messageIds)
    .is('seen_at', null);

  if (error && __DEV__) {
    console.warn('[Support Receipts] Failed to mark seen:', error.message);
  }
}
