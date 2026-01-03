import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

// GET /api/recipes/[id] - Get specific recipe
export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`recipe-get:${clientId}`, {
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
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: recipeId } = await segmentData.params;

    // Validate UUID format
    const uuidValidation = validateUUID(recipeId);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid recipe ID format' },
        { status: 400 }
      );
    }

    // Get recipe with ingredients
    const { data: recipe, error } = await supabase
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
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id] - Update recipe
export async function PUT(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`recipe-put:${clientId}`, {
    maxRequests: 30,
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
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: recipeId } = await segmentData.params;

    // Validate UUID format
    const uuidValidation = validateUUID(recipeId);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid recipe ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, servings, ingredients } = body;

    // Validate required fields
    if (
      !name ||
      !ingredients ||
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

    // Validate field lengths and ingredient count
    if (name.trim().length > 200) {
      return NextResponse.json(
        { error: 'Recipe name too long (max 200 chars)' },
        { status: 400 }
      );
    }
    if (description && description.length > 2000) {
      return NextResponse.json(
        { error: 'Description too long (max 2000 chars)' },
        { status: 400 }
      );
    }
    if (ingredients.length > 100) {
      return NextResponse.json(
        { error: 'Too many ingredients (max 100)' },
        { status: 400 }
      );
    }

    // Verify user owns this recipe BEFORE modifying anything
    const { data: existingRecipe, error: checkError } = await supabase
      .from('user_recipes')
      .select('id')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Update recipe
    const { error: recipeError } = await supabase
      .from('user_recipes')
      .update({
        name: name.trim().substring(0, 200),
        description: (description?.trim() || '').substring(0, 2000),
        servings: Math.min(Math.max(1, servings || 1), 100),
      })
      .eq('id', recipeId)
      .eq('user_id', user.id);

    if (recipeError) {
      console.error('Error updating recipe:', recipeError);
      return NextResponse.json(
        { error: 'Failed to update recipe' },
        { status: 500 }
      );
    }

    // Delete existing ingredients
    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', recipeId);

    if (deleteError) {
      console.error('Error deleting old ingredients:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update recipe ingredients' },
        { status: 500 }
      );
    }

    // Create new ingredients
    const ingredientInserts = ingredients.map((ingredient: any) => ({
      recipe_id: recipeId,
      food_id: ingredient.food_id,
      quantity: ingredient.quantity,
      food_type: ingredient.food_type || 'regular',
    }));

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientInserts);

    if (ingredientsError) {
      console.error('Error creating new ingredients:', ingredientsError);
      return NextResponse.json(
        { error: 'Failed to update recipe ingredients' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] - Delete recipe
export async function DELETE(
  request: NextRequest,
  segmentData: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`recipe-delete:${clientId}`, {
    maxRequests: 30,
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
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseClient(authHeader);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: recipeId } = await segmentData.params;

    // Validate UUID format
    const uuidValidation = validateUUID(recipeId);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid recipe ID format' },
        { status: 400 }
      );
    }

    // Delete recipe (ingredients will be deleted by cascade)
    const { error } = await supabase
      .from('user_recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting recipe:', error);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
