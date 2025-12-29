import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { UserSearchFilters } from '@/types/profile';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

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

// GET /api/profile/search - Search for users
export async function GET(request: NextRequest) {
  // Apply rate limiting - 30 requests per minute per IP
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`search:${clientId}`, {
    maxRequests: 30,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetIn),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetIn),
        },
      }
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

    // Parse search params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const primaryGoal = searchParams.get('goal') || null;
    const location = searchParams.get('location') || null;
    const interests =
      searchParams.get('interests')?.split(',').filter(Boolean) || [];
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for public profiles
    let dbQuery = supabase
      .from('user_profiles')
      .select(
        `
        user_id,
        username,
        display_name,
        avatar_url,
        bio,
        primary_goal,
        interests,
        location
      `
      )
      .eq('is_public', true)
      .neq('user_id', user.id) // Exclude self
      .not('username', 'is', null); // Must have username

    // Apply text search if query provided
    if (query.trim()) {
      // Sanitize query to prevent injection - escape special Postgres pattern chars
      const sanitizedQuery = query
        .trim()
        .replace(/[%_*\\]/g, '\\$&') // Escape special pattern characters
        .substring(0, 100); // Limit length

      dbQuery = dbQuery.or(
        `username.ilike.*${sanitizedQuery}*,display_name.ilike.*${sanitizedQuery}*`
      );
    }

    // Filter by primary goal - validate against allowed values
    const validGoals = [
      'lose_weight',
      'gain_muscle',
      'maintain',
      'improve_health',
      'athletic_performance',
    ];
    if (primaryGoal && validGoals.includes(primaryGoal)) {
      dbQuery = dbQuery.eq('primary_goal', primaryGoal);
    }

    // Filter by location - sanitize input
    if (location) {
      const sanitizedLocation = location
        .replace(/[%_\\]/g, '\\$&')
        .substring(0, 100);
      dbQuery = dbQuery.ilike('location', `%${sanitizedLocation}%`);
    }

    // Apply pagination
    dbQuery = dbQuery
      .order('display_name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data: profiles, error } = await dbQuery;

    if (error) throw error;

    // Get connection status for each user
    const userIds = profiles?.map((p) => p.user_id) || [];

    let connections: any[] = [];
    if (userIds.length > 0) {
      const { data: connectionData } = await supabase
        .from('user_connections')
        .select('follower_id, following_id, status')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      connections = connectionData || [];
    }

    // Build result with connection status
    const results = (profiles || [])
      .map((profile) => {
        let connectionStatus = 'none';

        const connection = connections.find(
          (c) =>
            (c.follower_id === user.id && c.following_id === profile.user_id) ||
            (c.following_id === user.id && c.follower_id === profile.user_id)
        );

        if (connection) {
          if (connection.status === 'accepted') {
            connectionStatus = 'accepted';
          } else if (connection.status === 'pending') {
            connectionStatus =
              connection.follower_id === user.id
                ? 'pending_sent'
                : 'pending_received';
          } else if (connection.status === 'blocked') {
            connectionStatus = 'blocked';
          }
        }

        // Filter by interests if specified (done in JS since JSONB array matching is complex)
        if (interests.length > 0) {
          const profileInterests = (profile.interests || []).map((i: string) =>
            i.toLowerCase()
          );
          const hasMatchingInterest = interests.some((i) =>
            profileInterests.includes(i.toLowerCase())
          );
          if (!hasMatchingInterest) {
            return null;
          }
        }

        return {
          ...profile,
          connection_status: connectionStatus,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      users: results,
      total: results.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error searching profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
