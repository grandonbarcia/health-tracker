'use client';

import { useEffect, useRef } from 'react';
import { MessageWithSender, ConversationWithDetails } from '@/types/messages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import {
  getConversationDisplayName,
  getConversationAvatar,
  getInitials,
  groupMessagesByDate,
} from '@/lib/messageUtils';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageThreadProps {
  conversation: ConversationWithDetails;
  messages: MessageWithSender[];
  currentUserId: string;
  loading: boolean;
  sending: boolean;
  hasMore: boolean;
  onSendMessage: (content: string) => void;
  onLoadMore: () => void;
  onBack?: () => void;
}

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  loading,
  sending,
  hasMore,
  onSendMessage,
  onLoadMore,
  onBack,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const displayName = getConversationDisplayName(conversation, currentUserId);
  const avatarUrl = getConversationAvatar(conversation, currentUserId);
  const messageGroups = groupMessagesByDate(messages);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

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

        <div>
          <h2 className="font-semibold">{displayName}</h2>
          {conversation.conversation_type === 'direct' && (
            <p className="text-xs text-muted-foreground">Direct message</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Load earlier messages
            </Button>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  {group.date}
                </div>
              </div>

              {/* Messages in group */}
              <div className="space-y-1">
                {group.messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showAvatar={
                      index === 0 ||
                      group.messages[index - 1]?.sender_id !== message.sender_id
                    }
                    showTimestamp={
                      index === group.messages.length - 1 ||
                      group.messages[index + 1]?.sender_id !== message.sender_id
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} disabled={sending} />
    </div>
  );
}
