import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// PUT /api/connections/[id] - Accept or reject connection request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const { action } = await request.json();

    if (!['accept', 'reject', 'block'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept, reject, or block' },
        { status: 400 }
      );
    }

    // Get the connection
    const { data: connection, error: fetchError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this connection
    if (
      connection.follower_id !== user.id &&
      connection.following_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Not authorized to modify this connection' },
        { status: 403 }
      );
    }

    // Only the recipient can accept/reject pending requests
    if (
      connection.status === 'pending' &&
      connection.following_id !== user.id &&
      action !== 'block'
    ) {
      return NextResponse.json(
        { error: 'Only the recipient can accept or reject requests' },
        { status: 403 }
      );
    }

    if (action === 'reject') {
      // Delete the connection
      const { error: deleteError } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ message: 'Connection rejected' });
    }

    // Update status
    const newStatus = action === 'accept' ? 'accepted' : 'blocked';

    const { data: updated, error: updateError } = await supabase
      .from('user_connections')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ connection: updated });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/connections/[id] - Remove connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Get the connection first to verify ownership
    const { data: connection } = await supabase
      .from('user_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this connection
    if (
      connection.follower_id !== user.id &&
      connection.following_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Not authorized to delete this connection' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
