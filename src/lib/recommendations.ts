// Smart food recommendation algorithms
import { FOOD_DB, RDI, NutrientProfile } from './nutrients';

export interface RecommendationReason {
  nutrient: string;
  current: number;
  goal: number;
  remaining: number;
  percentage: number;
}

export interface FoodRecommendation {
  foodId: string;
  foodName: string;
  score: number;
  reasons: RecommendationReason[];
  nutritionHighlights: {
    nutrient: string;
    amount: number;
    unit: string;
  }[];
}

export interface NutrientGaps {
  [nutrient: string]: {
    current: number;
    goal: number;
    remaining: number;
    percentage: number;
    priority: 'high' | 'medium' | 'low';
  };
}

/**
 * Analyze current nutrition vs goals to identify gaps
 */
export function analyzeNutrientGaps(
  currentNutrition: Record<string, number>,
  goals: Record<string, number>
): NutrientGaps {
  const gaps: NutrientGaps = {};

  for (const [nutrient, goal] of Object.entries(goals)) {
    const current = currentNutrition[nutrient] || 0;
    const remaining = Math.max(0, goal - current);
    const percentage = (current / goal) * 100;

    // Determine priority based on how far from goal
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (percentage < 50) priority = 'high';
    else if (percentage < 80) priority = 'medium';

    gaps[nutrient] = {
      current,
      goal,
      remaining,
      percentage,
      priority,
    };
  }

  return gaps;
}

/**
 * Score a food based on how well it fills nutrient gaps
 */
function scoreFoodForGaps(
  food: NutrientProfile,
  gaps: NutrientGaps,
  maxCalories?: number
): number {
  let score = 0;
  const weights = {
    calories: 1.0,
    protein: 1.5,
    carbs: 1.0,
    fat: 1.0,
    fiber: 1.2,
    sodium: 0.5, // Lower weight for sodium (usually want less)
  };

  // Penalty if food exceeds remaining calories significantly
  if (maxCalories && food.calories > maxCalories * 1.5) {
    score -= 50;
  }

  for (const [nutrient, gap] of Object.entries(gaps)) {
    if (gap.remaining <= 0) continue; // Already met this goal

    const foodNutrient = (food as any)[nutrient] || 0;
    const weight = (weights as any)[nutrient] || 1.0;

    // Calculate how much this food contributes to the gap
    const contribution = Math.min(foodNutrient, gap.remaining);
    const gapFillingRatio = contribution / gap.remaining;

    // Priority multiplier
    let priorityMultiplier = 1.0;
    if (gap.priority === 'high') priorityMultiplier = 2.0;
    else if (gap.priority === 'medium') priorityMultiplier = 1.5;

    // Add to score based on contribution
    score += gapFillingRatio * weight * priorityMultiplier * 10;
  }

  // Bonus for nutrient density (nutrients per calorie)
  const protein = food.protein || 0;
  const fiber = food.fiber || 0;
  const calories = food.calories || 1;

  const proteinDensity = protein / calories;
  const fiberDensity = fiber / calories;

  score += proteinDensity * 20; // Bonus for protein density
  score += fiberDensity * 15; // Bonus for fiber density

  return Math.max(0, score);
}

/**
 * Get smart food recommendations based on nutrition gaps
 */
export function getSmartFoodRecommendations(
  currentNutrition: Record<string, number>,
  goals: Record<string, number>,
  maxRecommendations: number = 8
): FoodRecommendation[] {
  const gaps = analyzeNutrientGaps(currentNutrition, goals);

  // Calculate remaining calories for context
  const remainingCalories = gaps.calories?.remaining || 0;

  // Get all foods and score them
  const scoredFoods = Object.entries(FOOD_DB).map(([foodId, food]) => {
    const score = scoreFoodForGaps(food, gaps, remainingCalories);

    // Identify key reasons for recommendation
    const reasons: RecommendationReason[] = [];
    const highlights: { nutrient: string; amount: number; unit: string }[] = [];

    for (const [nutrient, gap] of Object.entries(gaps)) {
      if (gap.remaining > 0) {
        const foodNutrient = (food as any)[nutrient] || 0;
        if (foodNutrient >= gap.remaining * 0.1) {
          // If food provides at least 10% of remaining need
          reasons.push({
            nutrient,
            current: gap.current,
            goal: gap.goal,
            remaining: gap.remaining,
            percentage: gap.percentage,
          });

          // Add nutrition highlights
          const units: Record<string, string> = {
            calories: 'kcal',
            protein: 'g',
            carbs: 'g',
            fat: 'g',
            fiber: 'g',
            sodium: 'mg',
          };

          highlights.push({
            nutrient,
            amount: foodNutrient,
            unit: units[nutrient] || '',
          });
        }
      }
    }

    return {
      foodId,
      foodName: food.serving ? `${foodId} (${food.serving})` : foodId,
      score,
      reasons: reasons.slice(0, 3), // Top 3 reasons
      nutritionHighlights: highlights.slice(0, 3), // Top 3 highlights
    };
  });

  // Sort by score and return top recommendations
  return scoredFoods
    .filter((food) => food.score > 0 && food.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);
}

/**
 * Generate human-readable recommendation messages
 */
export function generateRecommendationMessages(gaps: NutrientGaps): string[] {
  const messages: string[] = [];

  const priorityGaps = Object.entries(gaps)
    .filter(([_, gap]) => gap.remaining > 0)
    .sort((a, b) => {
      // Sort by priority and amount remaining
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a[1].priority];
      const bPriority = priorityOrder[b[1].priority];

      if (aPriority !== bPriority) return bPriority - aPriority;
      return b[1].remaining - a[1].remaining;
    });

  for (const [nutrient, gap] of priorityGaps.slice(0, 3)) {
    const units: Record<string, string> = {
      calories: 'calories',
      protein: 'g protein',
      carbs: 'g carbs',
      fat: 'g fat',
      fiber: 'g fiber',
      sodium: 'mg sodium',
    };

    const unit = units[nutrient] || nutrient;
    const remaining = Math.round(gap.remaining);

    if (gap.priority === 'high') {
      messages.push(`⚠️ You need ${remaining} more ${unit} to reach your goal`);
    } else if (gap.priority === 'medium') {
      messages.push(`📍 Consider adding ${remaining} more ${unit}`);
    }
  }

  return messages;
}
