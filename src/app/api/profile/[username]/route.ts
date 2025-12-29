import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
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

// Create a service role client to bypass RLS for stats queries
function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// GET /api/profile/[username] - Get public profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`profile-public:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  const { username } = await params;

  // Validate username format (max 30 chars, alphanumeric + underscores)
  if (!username || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: 'Invalid username format' },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get('authorization');

  // Auth is optional for viewing public profiles
  const supabase = authHeader
    ? createSupabaseClient(authHeader)
    : createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

  try {
    let currentUserId: string | null = null;

    if (authHeader) {
      const {
        data: { user },
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      currentUserId = user?.id || null;
    }

    // Get the profile by username
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if this is the user's own profile
    const isOwnProfile = currentUserId === profile.user_id;

    // Check if profile is public or user has access
    if (!isOwnProfile && !profile.is_public) {
      // Check if they're connected
      if (currentUserId) {
        const { data: connection } = await supabase
          .from('user_connections')
          .select('status')
          .or(
            `and(follower_id.eq.${currentUserId},following_id.eq.${profile.user_id}),and(follower_id.eq.${profile.user_id},following_id.eq.${currentUserId})`
          )
          .eq('status', 'accepted')
          .single();

        if (!connection) {
          return NextResponse.json(
            { error: 'This profile is private' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'This profile is private' },
          { status: 403 }
        );
      }
    }

    // Filter out private data based on privacy settings
    const publicProfile = filterProfileByPrivacy(profile, isOwnProfile);

    // Get connection status if authenticated
    let connectionStatus: string = 'none';
    if (currentUserId) {
      if (isOwnProfile) {
        connectionStatus = 'self';
      } else {
        const { data: connection } = await supabase
          .from('user_connections')
          .select('status, follower_id')
          .or(
            `and(follower_id.eq.${currentUserId},following_id.eq.${profile.user_id}),and(follower_id.eq.${profile.user_id},following_id.eq.${currentUserId})`
          )
          .single();

        if (connection) {
          if (connection.status === 'accepted') {
            connectionStatus = 'accepted';
          } else if (connection.status === 'pending') {
            connectionStatus =
              connection.follower_id === currentUserId
                ? 'pending_sent'
                : 'pending_received';
          } else if (connection.status === 'blocked') {
            connectionStatus = 'blocked';
          }
        }
      }
    }

    // Get achievements (public ones)
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('achieved_at', { ascending: false })
      .limit(10);

    // Get public milestones
    const { data: milestones } = await supabase
      .from('health_milestones')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('is_public', true)
      .order('achieved_at', { ascending: false })
      .limit(10);

    // Get stats using service role to bypass RLS
    const stats = await getPublicStats(profile.user_id, profile);

    return NextResponse.json({
      profile: publicProfile,
      stats,
      achievements: achievements || [],
      milestones: milestones || [],
      connectionStatus,
      isOwnProfile,
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Filter profile data based on privacy settings
function filterProfileByPrivacy(profile: any, isOwnProfile: boolean) {
  if (isOwnProfile) {
    return profile;
  }

  const publicProfile = {
    user_id: profile.user_id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    primary_goal: profile.primary_goal,
    activity_level: profile.activity_level,
    interests: profile.interests,
    location: profile.location,
    created_at: profile.created_at,
  };

  // Add optional fields based on privacy settings
  if (profile.show_weight) {
    (publicProfile as any).current_weight_lbs = profile.current_weight_lbs;
    (publicProfile as any).target_weight_lbs = profile.target_weight_lbs;
  }

  return publicProfile;
}

// Get public-friendly stats using service role to bypass RLS
async function getPublicStats(userId: string, profile: any) {
  const stats: any = {
    member_since: profile.created_at,
  };

  // Use service role client to bypass RLS and query other users' data
  const serviceClient = createServiceRoleClient();

  try {
    // Get workout stats if allowed
    if (profile.show_workouts) {
      const { count: totalWorkouts, error: workoutError } = await serviceClient
        .from('user_workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (workoutError) {
        console.error('Error fetching workouts:', workoutError);
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: workoutsThisMonth, error: monthError } =
        await serviceClient
          .from('user_workouts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('date', startOfMonth.toISOString().split('T')[0]);

      if (monthError) {
        console.error('Error fetching monthly workouts:', monthError);
      }

      stats.total_workouts = totalWorkouts || 0;
      stats.workouts_this_month = workoutsThisMonth || 0;
    }

    // Get nutrition stats if allowed
    if (profile.show_nutrition) {
      const { count: totalDaysLogged, error: daysError } = await serviceClient
        .from('user_days')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (daysError) {
        console.error('Error fetching days logged:', daysError);
      }

      stats.total_days_logged = totalDaysLogged || 0;
    }
  } catch (error) {
    console.error('Error getting public stats:', error);
    if (profile.show_workouts) {
      stats.total_workouts = 0;
      stats.workouts_this_month = 0;
    }
    if (profile.show_nutrition) {
      stats.total_days_logged = 0;
    }
  }

  return stats;
}
