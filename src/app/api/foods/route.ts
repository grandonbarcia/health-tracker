import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(req: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`foods-post:${clientId}`, {
    maxRequests: 30,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  // Authentication required for adding foods
  const authHeader = req.headers.get('authorization');
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

    const food = await req.json();

    // Validate required fields
    if (!food.id || !food.name) {
      return NextResponse.json(
        { error: 'id and name are required' },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (food.id.length > 100) {
      return NextResponse.json(
        { error: 'Food ID must be 100 characters or less' },
        { status: 400 }
      );
    }
    if (food.name.length > 200) {
      return NextResponse.json(
        { error: 'Food name must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Insert food into database
    const { data, error } = await supabase
      .from('foods')
      .insert({
        id: food.id,
        name: food.name,
        serving: food.serving?.substring(0, 100) || null,
        calories: Math.max(0, Number(food.calories) || 0),
        protein: Math.max(0, Number(food.protein) || 0),
        carbs: Math.max(0, Number(food.carbs) || 0),
        fat: Math.max(0, Number(food.fat) || 0),
        fiber: Math.max(0, Number(food.fiber) || 0),
        sugar: Math.max(0, Number(food.sugar) || 0),
        sodium: Math.max(0, Number(food.sodium) || 0),
        calcium: Math.max(0, Number(food.calcium) || 0),
        iron: Math.max(0, Number(food.iron) || 0),
        potassium: Math.max(0, Number(food.potassium) || 0),
        vitaminC: Math.max(0, Number(food.vitaminC) || 0),
        vitaminA: Math.max(0, Number(food.vitaminA) || 0),
        vitaminD: Math.max(0, Number(food.vitaminD) || 0),
        cholesterol: Math.max(0, Number(food.cholesterol) || 0),
        aliases: Array.isArray(food.aliases) ? food.aliases.slice(0, 10) : [],
        metadata: typeof food.metadata === 'object' ? food.metadata : {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Food with this id already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error adding food:', err);
    return NextResponse.json({ error: 'Failed to add food' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(`foods-get:${clientId}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetIn) } }
    );
  }

  // GET can be public for food database browsing
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .order('name')
      .limit(500); // Limit response size

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching foods:', err);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}
