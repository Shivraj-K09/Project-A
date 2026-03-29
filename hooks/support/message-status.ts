import { SupportMessage } from './types';

export function applySupportReceiptStatuses(messages: SupportMessage[]): SupportMessage[] {
  return messages.map((message) => {
    if (!message.is_mine) return message;
    if (message.status === 'pending' || message.status === 'error') return message;

    if (message.seen_at) {
      return {
        ...message,
        status: 'read',
      };
    }

    if (message.delivered_at) {
      return {
        ...message,
        status: 'delivered',
      };
    }

    return {
      ...message,
      status: 'sent',
    };
  });
}
