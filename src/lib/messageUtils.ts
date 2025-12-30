import {
  ConversationWithDetails,
  MessageWithSender,
  MessageGroup,
} from '@/types/messages';
import { UserProfile } from '@/types/profile';

/**
 * Format a timestamp for message display
 * Shows time for today, day name for this week, or date for older
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Less than 1 minute ago
  if (diffMins < 1) {
    return 'Just now';
  }

  // Less than 1 hour ago
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  // Less than 24 hours ago
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Today - show time
  if (isToday(date)) {
    return formatTime(date);
  }

  // Yesterday
  if (isYesterday(date)) {
    return 'Yesterday';
  }

  // This week - show day name
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Older - show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format full timestamp for message bubble
 */
export function formatFullMessageTime(timestamp: string): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return `Today at ${formatTime(date)}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${formatTime(date)}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format time as HH:MM AM/PM
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Get display name for a conversation
 * For direct chats, returns the other participant's name
 */
export function getConversationDisplayName(
  conversation: ConversationWithDetails,
  currentUserId: string
): string {
  // For group chats, use the conversation name
  if (conversation.conversation_type === 'group' && conversation.name) {
    return conversation.name;
  }

  // For direct chats, use the other participant's name
  if (conversation.other_participant) {
    return (
      conversation.other_participant.display_name ||
      conversation.other_participant.username ||
      'Unknown User'
    );
  }

  // Fallback: find other participant from participants list
  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId
  );

  if (otherParticipant?.profile) {
    return (
      otherParticipant.profile.display_name ||
      otherParticipant.profile.username ||
      'Unknown User'
    );
  }

  return 'Unknown Conversation';
}

/**
 * Get avatar URL for a conversation
 */
export function getConversationAvatar(
  conversation: ConversationWithDetails,
  currentUserId: string
): string | null {
  if (conversation.other_participant?.avatar_url) {
    return conversation.other_participant.avatar_url;
  }

  const otherParticipant = conversation.participants?.find(
    (p) => p.user_id !== currentUserId
  );

  return otherParticipant?.profile?.avatar_url || null;
}

/**
 * Get display name for a user profile
 */
export function getUserDisplayName(
  profile: Partial<UserProfile> | undefined | null
): string {
  if (!profile) return 'Unknown User';
  return profile.display_name || profile.username || 'Unknown User';
}

/**
 * Group messages by date for display
 */
export function groupMessagesByDate(
  messages: MessageWithSender[]
): MessageGroup[] {
  const groups: Map<string, MessageWithSender[]> = new Map();

  for (const message of messages) {
    const date = new Date(message.created_at);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = 'Today';
    } else if (isYesterday(date)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year:
          date.getFullYear() !== new Date().getFullYear()
            ? 'numeric'
            : undefined,
      });
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  }

  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }));
}

/**
 * Validate and sanitize message content
 */
export function validateMessageContent(content: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 5000) {
    return { valid: false, error: 'Message too long (max 5000 characters)' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Truncate text for preview
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Check if messages should be grouped (same sender, within 5 minutes)
 */
export function shouldGroupMessages(
  current: MessageWithSender,
  previous: MessageWithSender | null
): boolean {
  if (!previous) return false;
  if (current.sender_id !== previous.sender_id) return false;

  const currentTime = new Date(current.created_at).getTime();
  const previousTime = new Date(previous.created_at).getTime();
  const diffMinutes = (currentTime - previousTime) / 60000;

  return diffMinutes < 5;
}

/**
 * Generate initials from a name for avatar fallback
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
