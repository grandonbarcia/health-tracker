// TypeScript types for messaging system

import { UserProfile } from './profile';

// =============================================
// ENUMS & CONSTANTS
// =============================================

export type ConversationType = 'direct' | 'group';

export type MessageType = 'text' | 'image' | 'system';

// =============================================
// CONVERSATION
// =============================================

export interface Conversation {
  id: string;
  conversation_type: ConversationType;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_preview: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  last_read_at: string;
}

// Enriched conversation with participant info for display
export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipantWithProfile[];
  unread_count: number;
  // For direct conversations, the other user's profile
  other_participant?: Partial<UserProfile>;
}

export interface ConversationParticipantWithProfile
  extends ConversationParticipant {
  profile?: Partial<UserProfile>;
}

// =============================================
// MESSAGES
// =============================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  message_type: MessageType;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Message with sender profile for display
export interface MessageWithSender extends Message {
  sender_profile?: Partial<UserProfile>;
  is_own_message: boolean;
}

// =============================================
// READ RECEIPTS
// =============================================

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

// =============================================
// INPUT TYPES
// =============================================

export interface CreateConversationInput {
  // For direct messages, provide the other user's ID
  participant_id: string;
  // Optional initial message
  initial_message?: string;
}

export interface SendMessageInput {
  content: string;
  message_type?: MessageType;
  metadata?: Record<string, any>;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ConversationsListResponse {
  conversations: ConversationWithDetails[];
  total_unread: number;
}

export interface MessagesListResponse {
  messages: MessageWithSender[];
  conversation: ConversationWithDetails;
  has_more: boolean;
  next_cursor?: string;
}

export interface UnreadCountResponse {
  total_unread: number;
  by_conversation: {
    conversation_id: string;
    unread_count: number;
  }[];
}

// =============================================
// UTILITY TYPES
// =============================================

// For grouping messages by date in the UI
export interface MessageGroup {
  date: string;
  messages: MessageWithSender[];
}

// For real-time subscriptions
export interface MessageEvent {
  type: 'new_message' | 'message_updated' | 'message_deleted';
  message: Message;
  conversation_id: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
}
