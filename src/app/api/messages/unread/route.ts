import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { UnreadCountResponse } from '@/types/messages';

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

// GET /api/messages/unread - Get unread message count
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`messages-unread:${clientId}`, {
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

  const supabase = createSupabaseClient(authHeader);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get total unread count using the database function
    const { data: totalUnread, error: totalError } = await supabase.rpc(
      'get_unread_message_count',
      { p_user_id: user.id }
    );

    if (totalError) {
      console.error('Error calling get_unread_message_count:', totalError);
    }

    // Get unread count per conversation
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)
      .is('left_at', null);

    if (partError) throw partError;

    // Calculate unread per conversation
    const byConversation: { conversation_id: string; unread_count: number }[] =
      [];

    if (participations && participations.length > 0) {
      for (const participation of participations) {
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', participation.conversation_id)
          .neq('sender_id', user.id)
          .gt('created_at', participation.last_read_at)
          .is('deleted_at', null);

        if (!countError && count && count > 0) {
          byConversation.push({
            conversation_id: participation.conversation_id,
            unread_count: count,
          });
        }
      }
    }

    return NextResponse.json({
      total_unread: typeof totalUnread === 'number' ? totalUnread : 0,
      by_conversation: byConversation,
    } as UnreadCountResponse);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
