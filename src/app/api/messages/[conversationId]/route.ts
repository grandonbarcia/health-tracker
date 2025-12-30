import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { validateUUID } from '@/lib/validation';
import { MessageWithSender, MessagesListResponse } from '@/types/messages';

function createSupabaseClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
}

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// GET /api/messages/[conversationId] - Get messages in a conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { conversationId } = await params;

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`messages-get:${clientId}`, {
    maxRequests: 120,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate conversationId
  if (!validateUUID(conversationId)) {
    return NextResponse.json(
      { error: 'Invalid conversation ID' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is a participant in this conversation
    const { data: participation, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const cursor = searchParams.get('cursor'); // Message ID for cursor-based pagination

    // Build query
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Apply cursor if provided
    if (cursor && validateUUID(cursor)) {
      const { data: cursorMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', cursor)
        .single();

      if (cursorMessage) {
        query = query.lt('created_at', cursorMessage.created_at);
      }
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) throw msgError;

    // Check if there are more messages
    const hasMore = (messages?.length || 0) > limit;
    const messagesToReturn = hasMore ? messages?.slice(0, limit) : messages;

    // Get unique sender IDs
    const senderIds = [
      ...new Set(
        (messagesToReturn || [])
          .filter((m) => m.sender_id)
          .map((m) => m.sender_id)
      ),
    ];

    // Fetch sender profiles
    let profiles: any[] = [];
    if (senderIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', senderIds);
      profiles = profileData || [];
    }

    // Enrich messages with sender info
    const enrichedMessages: MessageWithSender[] = (messagesToReturn || []).map(
      (msg) => ({
        ...msg,
        sender_profile: profiles.find((p) => p.user_id === msg.sender_id),
        is_own_message: msg.sender_id === user.id,
      })
    );

    // Get conversation details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    // Get other participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('left_at', null);

    const otherParticipant = (participants || []).find(
      (p) => p.user_id !== user.id
    );
    const otherProfile = otherParticipant
      ? profiles.find((p) => p.user_id === otherParticipant.user_id)
      : undefined;

    // If no profile found in messages, fetch it separately
    let finalOtherProfile = otherProfile;
    if (!finalOtherProfile && otherParticipant) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('user_id', otherParticipant.user_id)
        .single();
      finalOtherProfile = profileData;
    }

    return NextResponse.json({
      messages: enrichedMessages.reverse(), // Return in chronological order
      conversation: {
        ...conversation,
        participants: participants || [],
        other_participant: finalOtherProfile,
        unread_count: 0,
      },
      has_more: hasMore,
      next_cursor: hasMore ? messagesToReturn?.[limit - 1]?.id : undefined,
    } as MessagesListResponse);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages/[conversationId] - Send a message
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { conversationId } = await params;

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`messages-post:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate conversationId
  if (!validateUUID(conversationId)) {
    return NextResponse.json(
      { error: 'Invalid conversation ID' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is a participant in this conversation
    const { data: participation, error: partError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, message_type = 'text', metadata = {} } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 5000) {
      return NextResponse.json(
        { error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Validate message_type
    const validTypes = ['text', 'image', 'system'];
    if (!validTypes.includes(message_type)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }

    // Insert the message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedContent,
        message_type,
        metadata,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    // Update sender's last_read_at (they've read up to their own message)
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    const enrichedMessage: MessageWithSender = {
      ...newMessage,
      sender_profile: senderProfile,
      is_own_message: true,
    };

    return NextResponse.json({ message: enrichedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
