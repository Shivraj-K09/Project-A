export interface SupportMessage {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_mine: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  message_type?: 'text' | 'image' | 'file';
  attachment_path?: string;
  imageUrl?: string; // Local preview or decrypted blob URL
  delivered_at?: string | null;
  seen_at?: string | null;
}

export interface SupportSession {
  id: string;
  user_id: string;
  agent_id: string | null;
  status: 'active' | 'archived' | 'pending';
  created_at: string;
}

export interface RecipientKey {
  userId: string;
  key: string;
}

export interface SupporterInboxItem {
  id: string;
  user: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    name: string;
  };
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'pending' | 'archived';
  agent_id: string | null;
}
