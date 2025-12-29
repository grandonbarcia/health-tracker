import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get user's favorite foods
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`favorites:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create supabase client with auth
    const token = authHeader.replace('Bearer ', '');
    const supabaseWithAuth = createClient(
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseWithAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's favorites
    const { data: favorites, error } = await supabaseWithAuth
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      // Check if table doesn't exist
      if (
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      ) {
        return NextResponse.json(
          {
            error:
              'Favorites table not created yet. Please run the SQL setup first.',
            favorites: [],
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ favorites: [] }); // Return empty array on other errors
    }

    return NextResponse.json({
      favorites: favorites || [],
      count: favorites?.length || 0,
    });
  } catch (error) {
    console.error('Error in favorites GET:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        favorites: [],
      },
      { status: 500 }
    );
  }
}

// POST - Add a food to favorites
export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create supabase client with auth
    const token = authHeader.replace('Bearer ', '');
    const supabaseWithAuth = createClient(
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseWithAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { food_id, food_type = 'regular' } = body;

    if (!food_id) {
      return NextResponse.json(
        { error: 'food_id is required' },
        { status: 400 }
      );
    }

    console.log('Adding favorite:', { user_id: user.id, food_id, food_type });

    // Add to favorites (will ignore if already exists due to unique constraint)
    const { data, error } = await supabaseWithAuth
      .from('user_favorites')
      .insert({
        user_id: user.id,
        food_id,
        food_type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);

      // Check if table doesn't exist
      if (
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      ) {
        return NextResponse.json(
          {
            error:
              'Favorites table not created yet. Please run the SQL setup first.',
          },
          { status: 500 }
        );
      }

      // If it's a unique constraint violation, that's okay - already favorited
      if (error.code === '23505') {
        return NextResponse.json({
          message: 'Already in favorites',
          favorite: null,
        });
      }

      return NextResponse.json(
        { error: 'Failed to add favorite: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Added to favorites',
      favorite: data,
    });
  } catch (error) {
    console.error('Error in favorites POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a food from favorites
export async function DELETE(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create supabase client with auth
    const token = authHeader.replace('Bearer ', '');
    const supabaseWithAuth = createClient(
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseWithAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const food_id = searchParams.get('food_id');

    if (!food_id) {
      return NextResponse.json(
        { error: 'food_id is required' },
        { status: 400 }
      );
    }

    console.log('Removing favorite:', { user_id: user.id, food_id });

    // Remove from favorites
    const { error } = await supabaseWithAuth
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('food_id', food_id);

    if (error) {
      console.error('Error removing favorite:', error);

      // Check if table doesn't exist
      if (
        error.message.includes('does not exist') ||
        error.message.includes('schema cache')
      ) {
        return NextResponse.json(
          {
            error:
              'Favorites table not created yet. Please run the SQL setup first.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to remove favorite: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Removed from favorites',
    });
  } catch (error) {
    console.error('Error in favorites DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
