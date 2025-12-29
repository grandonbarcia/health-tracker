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

// GET /api/connections - Get user's connections
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'accepted';
    const type = searchParams.get('type') || 'all'; // 'all', 'following', 'followers', 'pending'

    let query = supabase.from('user_connections').select('*');

    if (type === 'following') {
      query = query.eq('follower_id', user.id);
    } else if (type === 'followers') {
      query = query.eq('following_id', user.id);
    } else if (type === 'pending') {
      query = query.eq('following_id', user.id).eq('status', 'pending');
    } else {
      query = query.or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
    }

    if (status !== 'all' && type !== 'pending') {
      query = query.eq('status', status);
    }

    const { data: connections, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;

    // Get profiles for all connected users
    const otherUserIds = (connections || []).map((c) =>
      c.follower_id === user.id ? c.following_id : c.follower_id
    );

    let profiles: any[] = [];
    if (otherUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select(
          'user_id, username, display_name, avatar_url, bio, primary_goal'
        )
        .in('user_id', otherUserIds);
      profiles = profileData || [];
    }

    // Combine connections with profile data
    const enrichedConnections = (connections || []).map((connection) => {
      const otherUserId =
        connection.follower_id === user.id
          ? connection.following_id
          : connection.follower_id;
      const profile = profiles.find((p) => p.user_id === otherUserId);

      return {
        ...connection,
        profile,
        is_follower: connection.following_id === user.id,
        is_following: connection.follower_id === user.id,
      };
    });

    // Count pending requests
    const { count: pendingCount } = await supabase
      .from('user_connections')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)
      .eq('status', 'pending');

    return NextResponse.json({
      connections: enrichedConnections,
      pendingCount: pendingCount || 0,
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/connections - Send connection request
export async function POST(request: NextRequest) {
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

    const { user_id: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user_id is required' },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot connect with yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists and allows friend requests
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('allow_friend_requests, is_public')
      .eq('user_id', targetUserId)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetProfile.allow_friend_requests) {
      return NextResponse.json(
        { error: 'This user is not accepting connection requests' },
        { status: 403 }
      );
    }

    // Check for existing connection
    const { data: existing } = await supabase
      .from('user_connections')
      .select('id, status')
      .or(
        `and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already connected' },
          { status: 400 }
        );
      } else if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Connection request already pending' },
          { status: 400 }
        );
      } else if (existing.status === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot connect with this user' },
          { status: 403 }
        );
      }
    }

    // Create connection request
    const { data: connection, error } = await supabase
      .from('user_connections')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
