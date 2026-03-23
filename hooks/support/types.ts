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

export interface SupportSession {
  id: string;
  user_id: string;
  agent_id: string | null;
  status: 'active' | 'archived';
  created_at: string;
}

export interface RecipientKey {
  userId: string;
  key: string;
}
