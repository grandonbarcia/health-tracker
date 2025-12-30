'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ConversationWithDetails,
  MessageWithSender,
  MessagesListResponse,
} from '@/types/messages';
import {
  ConversationList,
  MessageThread,
  NewConversationModal,
} from '@/components/messages';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');
  const startWithUserParam = searchParams.get('start');

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [showNewModal, setShowNewModal] = useState(false);
  const [startUserHandled, setStartUserHandled] = useState(false);

  // Check auth
  useEffect(() => {
    checkAuth();
  }, []);

  // Load conversation from URL param - only on initial load
  const [initialConvLoaded, setInitialConvLoaded] = useState(false);
  useEffect(() => {
    if (conversationIdParam && conversations.length > 0 && !initialConvLoaded) {
      const conv = conversations.find((c) => c.id === conversationIdParam);
      if (conv) {
        setInitialConvLoaded(true);
        handleSelectConversation(conv);
      }
    }
  }, [conversationIdParam, conversations, initialConvLoaded]);

  // Handle start with user param (from ConnectionButton)
  useEffect(() => {
    if (startWithUserParam && !loading && user && !startUserHandled) {
      setStartUserHandled(true);
      handleNewConversation(startWithUserParam);
    }
  }, [startWithUserParam, loading, user, startUserHandled]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }
    setUser(session.user);
    await loadConversations(session.access_token);
    setLoading(false);
  };

  const loadConversations = async (token?: string) => {
    try {
      const authToken =
        token || (await supabase.auth.getSession()).data.session?.access_token;
      if (!authToken) return;

      const response = await fetch('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load conversations');

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string, cursor?: string) => {
    setMessagesLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const url = cursor
        ? `/api/messages/${conversationId}?cursor=${cursor}`
        : `/api/messages/${conversationId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load messages');

      const data: MessagesListResponse = await response.json();

      if (cursor) {
        // Prepend older messages
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }

      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);

      // Mark as read
      await fetch(`/api/messages/${conversationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = async (
    conversation: ConversationWithDetails
  ) => {
    // Skip if already viewing this conversation
    if (selectedConversation?.id === conversation.id) {
      return;
    }

    // Clear unread count for this conversation in the list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      )
    );

    // Update selected conversation with cleared unread count
    setSelectedConversation({ ...conversation, unread_count: 0 });
    setMessages([]);
    setHasMore(false);
    setNextCursor(undefined);
    setInitialConvLoaded(true);

    // Update URL
    router.push(`/messages?conversation=${conversation.id}`, { scroll: false });

    await loadMessages(conversation.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !user) return;

    // Create optimistic message that appears instantly
    const optimisticMessage: MessageWithSender = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content,
      message_type: 'text',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      is_own_message: true,
      sender_profile: {
        user_id: user.id,
        username:
          user.user_metadata?.username || user.email?.split('@')[0] || 'You',
        display_name: user.user_metadata?.display_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
    };

    // Add message immediately (optimistic update)
    setMessages((prev) => [...prev, optimisticMessage]);
    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Replace optimistic message with real one from server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id ? data.message : msg
        )
      );

      // Update conversation list in background (don't await)
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = () => {
    if (selectedConversation && nextCursor) {
      loadMessages(selectedConversation.id, nextCursor);
    }
  };

  const handleNewConversation = async (userId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participant_id: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create conversation');
        return;
      }

      const data = await response.json();

      // Reload conversations and select the new/existing one
      await loadConversations();

      // Find and select the conversation
      const conv = conversations.find((c) => c.id === data.conversation.id);
      if (conv) {
        handleSelectConversation(conv);
      } else {
        // If not in list yet, create a temporary one
        handleSelectConversation({
          ...data.conversation,
          participants: [],
          unread_count: 0,
        });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
    router.push('/messages', { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile/Desktop header */}
      <div className="border-b p-4 md:hidden">
        <Link href="/community">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Community
          </Button>
        </Link>
      </div>

      <div className="flex h-[calc(100vh-57px)] md:h-screen">
        {/* Conversation list - hidden on mobile when conversation is selected */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r flex-shrink-0 ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          } flex-col`}
        >
          {/* Desktop back link */}
          <div className="hidden md:block p-4 border-b">
            <Link href="/community">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Community
              </Button>
            </Link>
          </div>

          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id || null}
              currentUserId={user?.id || ''}
              loading={false}
              onSelect={handleSelectConversation}
              onNewConversation={() => setShowNewModal(true)}
            />
          </div>
        </div>

        {/* Message thread */}
        <div
          className={`flex-1 ${
            selectedConversation ? 'flex' : 'hidden md:flex'
          } flex-col`}
        >
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user?.id || ''}
              loading={messagesLoading}
              sending={sending}
              hasMore={hasMore}
              onSendMessage={handleSendMessage}
              onLoadMore={handleLoadMore}
              onBack={handleBack}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-4">
              <div>
                <p className="text-muted-foreground text-lg">
                  Select a conversation
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Choose from your existing conversations or start a new one
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowNewModal(true)}
                >
                  Start a conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New conversation modal */}
      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSelectUser={handleNewConversation}
      />
    </div>
  );
}
