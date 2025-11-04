import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

// GET /api/recipes/[id] - Get specific recipe
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recipeId = params.id;

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
  { params }: { params: { id: string } }
) {
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

    const recipeId = params.id;
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

    // Update recipe
    const { error: recipeError } = await supabase
      .from('user_recipes')
      .update({
        name: name.trim(),
        description: description?.trim() || '',
        servings: servings || 1,
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
  { params }: { params: { id: string } }
) {
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

    const recipeId = params.id;

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
