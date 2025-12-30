'use client';

import { MessageWithSender } from '@/types/messages';
import {
  formatFullMessageTime,
  getInitials,
  getUserDisplayName,
} from '@/lib/messageUtils';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: MessageWithSender;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export function MessageBubble({
  message,
  showAvatar,
  showTimestamp,
}: MessageBubbleProps) {
  const isOwn = message.is_own_message;
  const senderName = getUserDisplayName(message.sender_profile);

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="w-8 flex-shrink-0">
        {showAvatar &&
          !isOwn &&
          (message.sender_profile?.avatar_url ? (
            <img
              src={message.sender_profile.avatar_url}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
              {getInitials(senderName)}
            </div>
          ))}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender name (for group chats or first message in sequence) */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl break-words',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {message.message_type === 'system' ? (
            <p className="text-sm italic">{message.content}</p>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {formatFullMessageTime(message.created_at)}
          </span>
        )}
      </div>

      {/* Spacer for own messages (to balance layout) */}
      {isOwn && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
