import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { validateUUID } from '@/lib/validation';
import {
  ConversationWithDetails,
  ConversationsListResponse,
} from '@/types/messages';

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

// GET /api/messages/conversations - List user's conversations
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`messages-conversations:${clientId}`, {
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

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all conversations the user participates in
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at, is_muted')
      .eq('user_id', user.id)
      .is('left_at', null);

    if (partError) {
      console.error('Error fetching participations:', partError);
      // If table doesn't exist, return empty list
      if (
        partError.code === '42P01' ||
        partError.message?.includes('does not exist')
      ) {
        return NextResponse.json({
          conversations: [],
          total_unread: 0,
        } as ConversationsListResponse);
      }
      throw partError;
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({
        conversations: [],
        total_unread: 0,
      } as ConversationsListResponse);
    }

    const conversationIds = participations.map((p) => p.conversation_id);

    // Get conversation details
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;

    // Get all participants for these conversations
    const { data: allParticipants, error: allPartError } = await supabase
      .from('conversation_participants')
      .select('*')
      .in('conversation_id', conversationIds)
      .is('left_at', null);

    if (allPartError) throw allPartError;

    // Get unique user IDs (excluding current user)
    const otherUserIds = [
      ...new Set(
        (allParticipants || [])
          .filter((p) => p.user_id !== user.id)
          .map((p) => p.user_id)
      ),
    ];

    // Fetch profiles for other participants
    let profiles: any[] = [];
    if (otherUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', otherUserIds);
      profiles = profileData || [];
    }

    // Calculate unread counts per conversation
    let totalUnread = 0;
    try {
      const { data: unreadCounts, error: unreadError } = await supabase.rpc(
        'get_unread_message_count',
        { p_user_id: user.id }
      );
      if (!unreadError && typeof unreadCounts === 'number') {
        totalUnread = unreadCounts;
      }
    } catch (e) {
      console.error('Error getting unread count:', e);
      // Continue without unread count
    }

    // Build enriched conversations
    const enrichedConversations: ConversationWithDetails[] = (
      conversations || []
    ).map((conv) => {
      const convParticipants = (allParticipants || []).filter(
        (p) => p.conversation_id === conv.id
      );
      const myParticipation = participations.find(
        (p) => p.conversation_id === conv.id
      );

      // Get other participant for direct conversations
      const otherParticipant = convParticipants.find(
        (p) => p.user_id !== user.id
      );
      const otherProfile = otherParticipant
        ? profiles.find((p) => p.user_id === otherParticipant.user_id)
        : undefined;

      // Calculate unread for this conversation
      // We'll do a simple check based on last_read_at
      const lastReadAt = myParticipation?.last_read_at
        ? new Date(myParticipation.last_read_at)
        : new Date(0);
      const lastMessageAt = new Date(conv.last_message_at);
      const hasUnread = lastMessageAt > lastReadAt;

      return {
        ...conv,
        participants: convParticipants.map((p) => ({
          ...p,
          profile: profiles.find((pr) => pr.user_id === p.user_id),
        })),
        other_participant: otherProfile,
        unread_count: hasUnread ? 1 : 0, // Simplified - full count would require another query
      };
    });

    return NextResponse.json({
      conversations: enrichedConversations,
      total_unread: totalUnread,
    } as ConversationsListResponse);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`messages-conversations-post:${clientId}`, {
    maxRequests: 30,
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

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { participant_id, initial_message } = body;

    // Validate initial_message if provided
    let sanitizedInitialMessage: string | undefined;
    if (initial_message !== undefined) {
      if (typeof initial_message !== 'string') {
        return NextResponse.json(
          { error: 'Initial message must be a string' },
          { status: 400 }
        );
      }
      const trimmed = initial_message.trim();
      if (trimmed.length > 5000) {
        return NextResponse.json(
          { error: 'Initial message too long (max 5000 characters)' },
          { status: 400 }
        );
      }
      if (trimmed.length > 0) {
        sanitizedInitialMessage = trimmed;
      }
    }

    // Validate participant_id
    if (!participant_id || !validateUUID(participant_id)) {
      return NextResponse.json(
        { error: 'Invalid participant_id' },
        { status: 400 }
      );
    }

    // Can't message yourself
    if (participant_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if users are connected (accepted connection)
    const { data: connections, error: connError } = await supabase
      .from('user_connections')
      .select('*')
      .or(
        `and(follower_id.eq.${user.id},following_id.eq.${participant_id}),and(follower_id.eq.${participant_id},following_id.eq.${user.id})`
      )
      .eq('status', 'accepted');

    if (connError) {
      console.error('Error checking connection:', connError);
      return NextResponse.json(
        { error: 'Failed to verify connection status' },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'You can only message users you are connected with' },
        { status: 403 }
      );
    }

    // Check for existing direct conversation using the helper function
    const { data: existingConvId, error: findError } = await supabase.rpc(
      'find_direct_conversation',
      {
        user1_id: user.id,
        user2_id: participant_id,
      }
    );

    if (findError) {
      console.error('Error finding conversation:', findError);
      // Continue to create new conversation if function fails
    }

    if (existingConvId) {
      // Return existing conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', existingConvId)
        .single();

      // Send initial message if provided
      if (sanitizedInitialMessage && existingConv) {
        await supabase.from('messages').insert({
          conversation_id: existingConv.id,
          sender_id: user.id,
          content: sanitizedInitialMessage,
          message_type: 'text',
        });
      }

      return NextResponse.json({
        conversation: existingConv,
        created: false,
      });
    }

    // Create new conversation using the atomic helper function
    // This bypasses RLS timing issues by creating conversation + participants together
    const { data: newConvId, error: createError } = await supabase.rpc(
      'create_or_get_direct_conversation',
      {
        p_user1_id: user.id,
        p_user2_id: participant_id,
      }
    );

    if (createError) {
      console.error('Error creating conversation:', createError);
      throw createError;
    }

    // Fetch the created conversation
    const { data: newConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', newConvId)
      .single();

    if (fetchError) throw fetchError;

    // Send initial message if provided
    if (sanitizedInitialMessage) {
      await supabase.from('messages').insert({
        conversation_id: newConversation.id,
        sender_id: user.id,
        content: sanitizedInitialMessage,
        message_type: 'text',
      });
    }

    // Get other participant's profile
    const { data: otherProfile } = await supabase
      .from('user_profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('user_id', participant_id)
      .single();

    return NextResponse.json(
      {
        conversation: {
          ...newConversation,
          other_participant: otherProfile,
        },
        created: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
