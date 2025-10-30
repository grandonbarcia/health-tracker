import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get recent foods for user
    const { data: recentFoods, error } = await supabase
      .from('user_food_history')
      .select('food_id, last_used_at, use_count')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false })
      .limit(20);

    if (error && error.code === 'PGRST205') {
      // Table doesn't exist, return empty array
      return NextResponse.json([]);
    } else if (error) {
      throw error;
    }

    if (!recentFoods || recentFoods.length === 0) {
      return NextResponse.json([]);
    }

    // Get food details from foods table
    const foodIds = recentFoods.map((f) => f.food_id);
    const { data: foods, error: foodsError } = await supabase
      .from('foods')
      .select('*')
      .in('id', foodIds);

    if (foodsError) {
      console.error('Error fetching foods:', foodsError);
      // Return recent foods without details if foods table fails
      return NextResponse.json(recentFoods);
    }

    // Combine recent history with food details
    const result = recentFoods
      .map((recent) => {
        const food = foods?.find((f) => f.id === recent.food_id);
        return {
          ...food,
          last_used_at: recent.last_used_at,
          use_count: recent.use_count,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recent foods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { food_id } = await request.json();
    if (!food_id) {
      return NextResponse.json(
        { error: 'food_id is required' },
        { status: 400 }
      );
    }

    // Try to upsert food history
    const { data, error } = await supabase
      .from('user_food_history')
      .upsert(
        {
          user_id: user.id,
          food_id,
          last_used_at: new Date().toISOString(),
          use_count: 1,
        },
        {
          onConflict: 'user_id,food_id',
          ignoreDuplicates: false,
        }
      )
      .select();

    if (error && error.code === 'PGRST205') {
      // Table doesn't exist, return success anyway for graceful degradation
      return NextResponse.json({
        success: true,
        note: 'Recent foods tracking will be available when database table is created',
      });
    } else if (error && error.details?.includes('duplicate')) {
      // If upsert failed due to conflict, update the existing record
      const { error: updateError } = await supabase.rpc(
        'increment_food_use_count',
        {
          p_user_id: user.id,
          p_food_id: food_id,
        }
      );

      if (updateError && updateError.code !== 'PGRST205') {
        // If RPC doesn't exist, try a simpler update
        const { error: simpleUpdateError } = await supabase
          .from('user_food_history')
          .update({
            last_used_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('food_id', food_id);

        if (simpleUpdateError && simpleUpdateError.code !== 'PGRST205') {
          throw simpleUpdateError;
        }
      }
    } else if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking food usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
