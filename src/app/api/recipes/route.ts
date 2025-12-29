import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('user_recipes')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        servings: servings || 1,
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

    // Create recipe ingredients
    const ingredientInserts = ingredients.map((ingredient: any) => ({
      recipe_id: recipe.id,
      food_id: ingredient.food_id,
      quantity: ingredient.quantity,
      food_type: ingredient.food_type || 'regular',
    }));

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
