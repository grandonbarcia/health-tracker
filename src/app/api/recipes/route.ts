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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// GET /api/recipes - List user's recipes
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`recipes:${clientId}`, {
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's recipes with ingredients
    const { data: recipes, error } = await supabase
      .from('user_recipes')
      .select(
        `
        id,
        name,
        description,
        servings,
        created_at,
        recipe_ingredients (
          id,
          food_id,
          quantity,
          food_type
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipes: recipes || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create new recipe
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, servings, ingredients } = body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedDescription =
      typeof description === 'string' ? description.trim() : '';

    // Validate required fields
    if (
      !trimmedName ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Recipe name and at least one ingredient are required',
        },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Recipe name must be at most 100 characters' },
        { status: 400 }
      );
    }

    if (trimmedDescription.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be at most 1000 characters' },
        { status: 400 }
      );
    }

    let servingsInt = 1;
    if (servings !== undefined && servings !== null) {
      if (!isFiniteNumber(servings)) {
        return NextResponse.json(
          { error: 'Servings must be a number' },
          { status: 400 }
        );
      }
      servingsInt = Math.round(servings);
    }
    if (servingsInt < 1 || servingsInt > 1000) {
      return NextResponse.json(
        { error: 'Servings must be between 1 and 1000' },
        { status: 400 }
      );
    }

    if (ingredients.length > 200) {
      return NextResponse.json(
        { error: 'Too many ingredients (max 200)' },
        { status: 400 }
      );
    }

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('user_recipes')
      .insert({
        user_id: user.id,
        name: trimmedName,
        description: trimmedDescription,
        servings: servingsInt,
      })
      .select()
      .single();

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      return NextResponse.json(
        { error: 'Failed to create recipe' },
        { status: 500 }
      );
    }

    // Create recipe ingredients (validate each ingredient)
    const ingredientInserts = ingredients.map(
      (ingredient: any, index: number) => {
        const foodId =
          typeof ingredient?.food_id === 'string'
            ? ingredient.food_id.trim()
            : '';
        if (!foodId || foodId.length > 128) {
          throw new Error(`Ingredient ${index + 1}: invalid food_id`);
        }

        const qty = ingredient?.quantity;
        if (!isFiniteNumber(qty) || qty <= 0 || qty > 10000) {
          throw new Error(`Ingredient ${index + 1}: invalid quantity`);
        }

        const foodType = ingredient?.food_type;
        const normalizedType =
          foodType === 'restaurant' || foodType === 'regular'
            ? foodType
            : 'regular';

        return {
          recipe_id: recipe.id,
          food_id: foodId,
          quantity: qty,
          food_type: normalizedType,
        };
      }
    );

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientInserts);

    if (ingredientsError) {
      console.error('Error creating recipe ingredients:', ingredientsError);
      // Clean up the recipe if ingredients failed
      await supabase.from('user_recipes').delete().eq('id', recipe.id);
      return NextResponse.json(
        { error: 'Failed to create recipe ingredients' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Recipe created successfully',
      recipe_id: recipe.id,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
