import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const food = await req.json();

    // Validate required fields
    if (!food.id || !food.name) {
      return NextResponse.json(
        { error: 'id and name are required' },
        { status: 400 }
      );
    }

    // Insert food into database
    const { data, error } = await supabase
      .from('foods')
      .insert({
        id: food.id,
        name: food.name,
        serving: food.serving || null,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
        sugar: food.sugar || 0,
        sodium: food.sodium || 0,
        calcium: food.calcium || 0,
        iron: food.iron || 0,
        potassium: food.potassium || 0,
        vitaminC: food.vitaminC || 0,
        vitaminA: food.vitaminA || 0,
        vitaminD: food.vitaminD || 0,
        cholesterol: food.cholesterol || 0,
        aliases: food.aliases || [],
        metadata: food.metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
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

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .order('name');

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
