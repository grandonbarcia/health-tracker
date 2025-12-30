'use client';

import { ConversationWithDetails } from '@/types/messages';
import {
  getConversationDisplayName,
  getConversationAvatar,
  formatMessageTime,
  getInitials,
  truncateText,
} from '@/lib/messageUtils';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const displayName = getConversationDisplayName(conversation, currentUserId);
  const avatarUrl = getConversationAvatar(conversation, currentUserId);
  const hasUnread = conversation.unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left',
        isSelected && 'bg-accent',
        hasUnread && 'bg-accent/30'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {getInitials(displayName)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'font-medium truncate',
              hasUnread && 'text-foreground'
            )}
          >
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatMessageTime(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'text-sm truncate',
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {conversation.last_message_preview
              ? truncateText(conversation.last_message_preview, 50)
              : 'No messages yet'}
          </p>

          {hasUnread && (
            <span className="flex-shrink-0 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {conversation.unread_count > 99
                ? '99+'
                : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
