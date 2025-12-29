import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { UserProfile, UserProfileInput } from '@/types/profile';

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

// GET /api/profile - Get current user's profile
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

    // Get user profile
    let { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile found - return null to indicate profile needs to be created
      return NextResponse.json({ profile: null, needsSetup: true });
    } else if (error) {
      throw error;
    }

    // Get profile stats
    const stats = await getProfileStats(supabase, user.id);

    return NextResponse.json({ profile, stats, needsSetup: false });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/profile - Create initial profile
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

    const body: UserProfileInput = await request.json();

    // Validate username if provided
    if (body.username) {
      const usernameError = validateUsername(body.username);
      if (usernameError) {
        return NextResponse.json({ error: usernameError }, { status: 400 });
      }

      // Check if username is taken
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', body.username.toLowerCase())
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Create profile
    const profileData = {
      user_id: user.id,
      username: body.username?.toLowerCase() || null,
      display_name: body.display_name || null,
      avatar_url: body.avatar_url || null,
      bio: body.bio || null,
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || null,
      height_cm: body.height_cm || null,
      current_weight_lbs: body.current_weight_lbs || null,
      target_weight_lbs: body.target_weight_lbs || null,
      primary_goal: body.primary_goal || null,
      activity_level: body.activity_level || null,
      dietary_preferences: body.dietary_preferences || [],
      location: body.location || null,
      interests: body.interests || [],
      is_public: body.is_public ?? true,
      allow_friend_requests: body.allow_friend_requests ?? true,
      show_on_leaderboards: body.show_on_leaderboards ?? true,
      show_weight: body.show_weight ?? false,
      show_nutrition: body.show_nutrition ?? true,
      show_workouts: body.show_workouts ?? true,
      show_vitals: body.show_vitals ?? false,
      show_progress_photos: body.show_progress_photos ?? false,
    };

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'Profile already exists or username taken' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
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

    const body: UserProfileInput = await request.json();

    // Validate username if being updated
    if (body.username !== undefined) {
      if (body.username) {
        const usernameError = validateUsername(body.username);
        if (usernameError) {
          return NextResponse.json({ error: usernameError }, { status: 400 });
        }

        // Check if username is taken by another user
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('id, user_id')
          .eq('username', body.username.toLowerCase())
          .single();

        if (existing && existing.user_id !== user.id) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 400 }
          );
        }
      }
      body.username = body.username?.toLowerCase() || undefined;
    }

    // Build update object (only include provided fields)
    const updates: Record<string, any> = {};
    const allowedFields = [
      'username',
      'display_name',
      'avatar_url',
      'bio',
      'date_of_birth',
      'gender',
      'height_cm',
      'current_weight_lbs',
      'target_weight_lbs',
      'primary_goal',
      'activity_level',
      'dietary_preferences',
      'location',
      'interests',
      'is_public',
      'allow_friend_requests',
      'show_on_leaderboards',
      'show_weight',
      'show_nutrition',
      'show_workouts',
      'show_vitals',
      'show_progress_photos',
    ];

    for (const field of allowedFields) {
      if ((body as any)[field] !== undefined) {
        updates[field] = (body as any)[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Validate username format
function validateUsername(username: string): string | null {
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 30) {
    return 'Username must be 30 characters or less';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  if (/^[0-9]/.test(username)) {
    return 'Username cannot start with a number';
  }
  // Reserved usernames
  const reserved = [
    'admin',
    'api',
    'profile',
    'settings',
    'community',
    'help',
    'support',
  ];
  if (reserved.includes(username.toLowerCase())) {
    return 'This username is reserved';
  }
  return null;
}

// Helper: Calculate current streak (consecutive days with activity)
async function calculateStreak(supabase: any, userId: string): Promise<number> {
  try {
    // Get all dates where user has logged meals
    const { data: daysData } = await supabase
      .from('user_days')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Get all dates where user has logged workouts
    const { data: workoutsData } = await supabase
      .from('user_workouts')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Combine and deduplicate dates
    const allDates = new Set<string>();
    daysData?.forEach((d: { date: string }) => allDates.add(d.date));
    workoutsData?.forEach((w: { date: string }) => allDates.add(w.date));

    if (allDates.size === 0) return 0;

    // Sort dates descending
    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate streak starting from today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if the most recent entry is today or yesterday
    const mostRecent = sortedDates[0];
    if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
      return 0; // Streak is broken
    }

    // Count consecutive days
    let streak = 0;
    let expectedDate = mostRecent === todayStr ? today : yesterday;

    for (const dateStr of sortedDates) {
      const expectedStr = expectedDate.toISOString().split('T')[0];
      if (dateStr === expectedStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (dateStr < expectedStr) {
        break; // Gap in streak
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// Helper: Get profile stats
async function getProfileStats(supabase: any, userId: string) {
  try {
    // Get workout count - using user_workouts table
    const { count: totalWorkouts, error: workoutError } = await supabase
      .from('user_workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (workoutError) {
      console.error('Error fetching workouts:', workoutError);
    }

    // Get this month's workouts
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: workoutsThisMonth, error: monthError } = await supabase
      .from('user_workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('date', startOfMonth.toISOString().split('T')[0]);

    if (monthError) {
      console.error('Error fetching monthly workouts:', monthError);
    }

    // Get total days logged
    const { count: totalDaysLogged, error: daysError } = await supabase
      .from('user_days')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (daysError) {
      console.error('Error fetching days logged:', daysError);
    }

    // Get member since date
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('user_id', userId)
      .single();

    // Calculate current streak (days with logged meals or workouts)
    const currentStreak = await calculateStreak(supabase, userId);

    return {
      total_workouts: totalWorkouts || 0,
      workouts_this_month: workoutsThisMonth || 0,
      total_days_logged: totalDaysLogged || 0,
      current_streak: currentStreak,
      member_since: profileData?.created_at || null,
    };
  } catch (error) {
    console.error('Error getting profile stats:', error);
    return {
      total_workouts: 0,
      workouts_this_month: 0,
      total_days_logged: 0,
      current_streak: 0,
      member_since: null,
    };
  }
}
