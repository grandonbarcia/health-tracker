import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { validateUUID } from '@/lib/validation';

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

// POST /api/messages/[conversationId]/read - Mark messages as read
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { conversationId } = await params;

  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`messages-read:${clientId}`, {
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

    // Update last_read_at to current timestamp
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: now })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      last_read_at: now,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
