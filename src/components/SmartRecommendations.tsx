'use client';
import { useMemo } from 'react';
import {
  getSmartFoodRecommendations,
  generateRecommendationMessages,
  analyzeNutrientGaps,
  FoodRecommendation,
} from '../lib/recommendations';

interface Props {
  currentNutrition: Record<string, number>;
  userGoals: Record<string, number> | null;
  onSelectFood: (foodId: string) => void;
  className?: string;
}

export default function SmartRecommendations({
  currentNutrition,
  userGoals,
  onSelectFood,
  className = '',
}: Props) {
  const { recommendations, messages, hasGaps } = useMemo(() => {
    if (!userGoals) {
      return { recommendations: [], messages: [], hasGaps: false };
    }

    const gaps = analyzeNutrientGaps(currentNutrition, userGoals);
    const recs = getSmartFoodRecommendations(currentNutrition, userGoals, 6);
    const msgs = generateRecommendationMessages(gaps);

    // Check if there are any meaningful gaps
    const significantGaps = Object.values(gaps).some(
      (gap) => gap.remaining > 0 && gap.percentage < 90
    );

    return {
      recommendations: recs,
      messages: msgs,
      hasGaps: significantGaps,
    };
  }, [currentNutrition, userGoals]);

  if (!userGoals || !hasGaps) {
    return null;
  }

  return (
    <div className={`bg-blue-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-600">🤖</span>
        <h3 className="font-semibold text-blue-900 text-sm">
          Smart Recommendations
        </h3>
      </div>

      {/* Recommendation Messages */}
      {messages.length > 0 && (
        <div className="mb-4 space-y-1">
          {messages.map((message, index) => (
            <p key={index} className="text-sm text-blue-800">
              {message}
            </p>
          ))}
        </div>
      )}

      {/* Food Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-xs text-blue-700 mb-2 font-medium">
            Suggested foods to help reach your goals:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.foodId}
                recommendation={rec}
                onSelect={() => onSelectFood(rec.foodId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  onSelect,
}: {
  recommendation: FoodRecommendation;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-300 hover:bg-blue-25 transition-all text-sm"
    >
      <div className="font-medium text-gray-900 mb-1">
        {recommendation.foodName}
      </div>

      {/* Nutrition Highlights */}
      {recommendation.nutritionHighlights.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {recommendation.nutritionHighlights.map((highlight, index) => (
            <span
              key={index}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
            >
              {highlight.amount}
              {highlight.unit} {highlight.nutrient}
            </span>
          ))}
        </div>
      )}

      {/* Primary Reason */}
      {recommendation.reasons.length > 0 && (
        <div className="text-xs text-gray-600">
          {formatRecommendationReason(recommendation.reasons[0])}
        </div>
      )}
    </button>
  );
}

function formatRecommendationReason(reason: any): string {
  const nutrientNames: Record<string, string> = {
    calories: 'calories',
    protein: 'protein',
    carbs: 'carbs',
    fat: 'fat',
    fiber: 'fiber',
    sodium: 'sodium',
  };

  const nutrientName = nutrientNames[reason.nutrient] || reason.nutrient;
  const remaining = Math.round(reason.remaining);

  return `Helps with ${remaining} more ${nutrientName} needed`;
}
