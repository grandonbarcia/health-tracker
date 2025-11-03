import { NextRequest, NextResponse } from 'next/server';
import {
  RESTAURANT_FOODS,
  searchRestaurantFoods,
  getRestaurantFoods,
  getFoodsByCategory,
  RESTAURANTS,
  RESTAURANT_CATEGORIES,
} from '../../../lib/restaurantFoods';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const restaurant = searchParams.get('restaurant') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    let foods = Object.values(RESTAURANT_FOODS);

    // Apply filters
    if (query) {
      foods = searchRestaurantFoods(query);
    }

    if (restaurant && restaurant !== 'all') {
      foods = foods.filter((food) => food.restaurant === restaurant);
    }

    if (category && category !== 'all') {
      foods = foods.filter((food) => food.category === category);
    }

    // Apply limit
    foods = foods.slice(0, limit);

    // Format for API response
    const response = foods.map((food) => ({
      id: food.id,
      name: `${food.restaurant} - ${food.name}`,
      restaurant: food.restaurant,
      category: food.category,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sodium: food.sodium,
      serving: food.serving,
      description: food.description,
      type: 'restaurant',
    }));

    return NextResponse.json({
      foods: response,
      meta: {
        total: foods.length,
        restaurants: RESTAURANTS,
        categories: RESTAURANT_CATEGORIES,
        query,
        restaurant,
        category,
        limit,
      },
    });
  } catch (error) {
    console.error('Error getting restaurant foods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for bulk operations (future use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'IDs must be an array' },
        { status: 400 }
      );
    }

    const foods = ids
      .map((id) => {
        const food = Object.values(RESTAURANT_FOODS).find((f) => f.id === id);
        return food
          ? {
              id: food.id,
              name: `${food.restaurant} - ${food.name}`,
              restaurant: food.restaurant,
              category: food.category,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
              fiber: food.fiber,
              sodium: food.sodium,
              serving: food.serving,
              description: food.description,
              type: 'restaurant',
            }
          : null;
      })
      .filter(Boolean);

    return NextResponse.json({ foods });
  } catch (error) {
    console.error('Error getting restaurant foods by IDs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
