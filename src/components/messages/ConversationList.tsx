'use client';

import { ConversationWithDetails } from '@/types/messages';
import { ConversationItem } from './ConversationItem';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  currentUserId: string;
  loading: boolean;
  onSelect: (conversation: ConversationWithDetails) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  loading,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Messages</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewConversation}
          title="New message"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquarePlus className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              No conversations yet
            </p>
            <Button variant="link" className="mt-2" onClick={onNewConversation}>
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
                isSelected={selectedId === conversation.id}
                onClick={() => onSelect(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
