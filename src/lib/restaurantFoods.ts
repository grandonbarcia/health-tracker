/**
 * Restaurant Foods Database
 *
 * Top 10-20 most popular items from major fast food chains
 * All nutrition data sourced from official restaurant websites
 */

export const RESTAURANT_FOODS = {
  // =============================================================================
  // MCDONALD'S - Top Popular Items
  // =============================================================================
  "McDonald's Big Mac": {
    id: 'mcdonalds_big_mac',
    name: 'Big Mac',
    restaurant: "McDonald's",
    category: 'Burgers',
    calories: 550,
    protein: 25,
    carbs: 45,
    fat: 33,
    fiber: 3,
    sodium: 1010,
    serving: '1 sandwich',
    description:
      'Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on sesame seed bun',
  },

  "McDonald's Quarter Pounder with Cheese": {
    id: 'mcdonalds_quarter_pounder_cheese',
    name: 'Quarter Pounder with Cheese',
    restaurant: "McDonald's",
    category: 'Burgers',
    calories: 520,
    protein: 30,
    carbs: 40,
    fat: 26,
    fiber: 2,
    sodium: 1120,
    serving: '1 sandwich',
    description:
      'Fresh beef quarter pound patty, cheese, ketchup, mustard, onions, pickles',
  },

  "McDonald's Chicken McNuggets (10 piece)": {
    id: 'mcdonalds_chicken_mcnuggets_10pc',
    name: 'Chicken McNuggets (10 piece)',
    restaurant: "McDonald's",
    category: 'Chicken',
    calories: 420,
    protein: 23,
    carbs: 25,
    fat: 25,
    fiber: 1,
    sodium: 840,
    serving: '10 pieces',
    description: 'Tender white meat chicken, seasoned and breaded',
  },

  "McDonald's Large Fries": {
    id: 'mcdonalds_large_fries',
    name: 'Large French Fries',
    restaurant: "McDonald's",
    category: 'Sides',
    calories: 320,
    protein: 4,
    carbs: 43,
    fat: 15,
    fiber: 4,
    sodium: 290,
    serving: '1 large order',
    description: 'Golden brown french fries with sea salt',
  },

  "McDonald's McChicken": {
    id: 'mcdonalds_mcchicken',
    name: 'McChicken',
    restaurant: "McDonald's",
    category: 'Chicken',
    calories: 400,
    protein: 14,
    carbs: 40,
    fat: 22,
    fiber: 2,
    sodium: 560,
    serving: '1 sandwich',
    description: 'Crispy chicken breast with lettuce and mayo',
  },

  // =============================================================================
  // KFC - Top Popular Items
  // =============================================================================
  'KFC Original Recipe Chicken Breast': {
    id: 'kfc_original_recipe_breast',
    name: 'Original Recipe Chicken Breast',
    restaurant: 'KFC',
    category: 'Chicken',
    calories: 390,
    protein: 39,
    carbs: 7,
    fat: 21,
    fiber: 1,
    sodium: 1170,
    serving: '1 piece',
    description: "Colonel's Original Recipe with 11 herbs and spices",
  },

  'KFC Popcorn Chicken (Large)': {
    id: 'kfc_popcorn_chicken_large',
    name: 'Popcorn Chicken (Large)',
    restaurant: 'KFC',
    category: 'Chicken',
    calories: 620,
    protein: 30,
    carbs: 33,
    fat: 39,
    fiber: 2,
    sodium: 1650,
    serving: '1 large order',
    description: 'Bite-sized pieces of tender chicken, seasoned and breaded',
  },

  'KFC Coleslaw': {
    id: 'kfc_coleslaw',
    name: 'Coleslaw',
    restaurant: 'KFC',
    category: 'Sides',
    calories: 170,
    protein: 1,
    carbs: 13,
    fat: 13,
    fiber: 3,
    sodium: 270,
    serving: '1 individual serving',
    description: 'Fresh cabbage and carrots in creamy dressing',
  },

  'KFC Biscuit': {
    id: 'kfc_biscuit',
    name: 'Buttermilk Biscuit',
    restaurant: 'KFC',
    category: 'Sides',
    calories: 180,
    protein: 4,
    carbs: 20,
    fat: 9,
    fiber: 1,
    sodium: 540,
    serving: '1 biscuit',
    description: 'Warm, fluffy buttermilk biscuit',
  },

  // =============================================================================
  // SUBWAY - Top Popular Items
  // =============================================================================
  'Subway Turkey Breast (6-inch)': {
    id: 'subway_turkey_breast_6inch',
    name: 'Turkey Breast (6-inch)',
    restaurant: 'Subway',
    category: 'Sandwiches',
    calories: 280,
    protein: 18,
    carbs: 46,
    fat: 3.5,
    fiber: 5,
    sodium: 810,
    serving: '6-inch sub on 9-grain wheat',
    description:
      'Turkey breast with lettuce, tomatoes, onions, green peppers, cucumbers',
  },

  'Subway Italian BMT (6-inch)': {
    id: 'subway_italian_bmt_6inch',
    name: 'Italian B.M.T. (6-inch)',
    restaurant: 'Subway',
    category: 'Sandwiches',
    calories: 410,
    protein: 19,
    carbs: 44,
    fat: 16,
    fiber: 5,
    sodium: 1260,
    serving: '6-inch sub on 9-grain wheat',
    description: 'Pepperoni, salami, ham with standard vegetables',
  },

  'Subway Chicken Teriyaki (6-inch)': {
    id: 'subway_chicken_teriyaki_6inch',
    name: 'Sweet Onion Chicken Teriyaki (6-inch)',
    restaurant: 'Subway',
    category: 'Sandwiches',
    calories: 370,
    protein: 25,
    carbs: 59,
    fat: 4.5,
    fiber: 5,
    sodium: 1040,
    serving: '6-inch sub on 9-grain wheat',
    description: 'Chicken strips with teriyaki glaze and standard vegetables',
  },

  'Subway Meatball Marinara (6-inch)': {
    id: 'subway_meatball_marinara_6inch',
    name: 'Meatball Marinara (6-inch)',
    restaurant: 'Subway',
    category: 'Sandwiches',
    calories: 480,
    protein: 23,
    carbs: 61,
    fat: 17,
    fiber: 7,
    sodium: 1610,
    serving: '6-inch sub on 9-grain wheat',
    description:
      'Seasoned meatballs in marinara sauce with standard vegetables',
  },

  // =============================================================================
  // PIZZA HUT - Top Popular Items
  // =============================================================================
  'Pizza Hut Pepperoni Personal Pan Pizza': {
    id: 'pizzahut_pepperoni_personal_pan',
    name: 'Pepperoni Personal Pan Pizza',
    restaurant: 'Pizza Hut',
    category: 'Pizza',
    calories: 150,
    protein: 6,
    carbs: 17,
    fat: 6,
    fiber: 1,
    sodium: 340,
    serving: '1 slice (1/4 of personal pan)',
    description: 'Personal pan pizza with pepperoni and cheese',
  },

  'Pizza Hut Meat Lovers Medium Pan Pizza': {
    id: 'pizzahut_meat_lovers_medium_pan_slice',
    name: "Meat Lover's Pizza (Medium Pan)",
    restaurant: 'Pizza Hut',
    category: 'Pizza',
    calories: 300,
    protein: 14,
    carbs: 21,
    fat: 18,
    fiber: 2,
    sodium: 760,
    serving: '1 slice (1/8 of medium)',
    description: 'Pepperoni, sausage, ham, bacon, and beef with cheese',
  },

  'Pizza Hut Breadsticks': {
    id: 'pizzahut_breadsticks',
    name: 'Breadsticks',
    restaurant: 'Pizza Hut',
    category: 'Sides',
    calories: 140,
    protein: 4,
    carbs: 20,
    fat: 6,
    fiber: 1,
    sodium: 240,
    serving: '1 breadstick',
    description: 'Warm breadstick with garlic butter',
  },

  // =============================================================================
  // TACO BELL - Top Popular Items
  // =============================================================================
  'Taco Bell Crunchy Taco': {
    id: 'tacobell_crunchy_taco',
    name: 'Crunchy Taco',
    restaurant: 'Taco Bell',
    category: 'Tacos',
    calories: 170,
    protein: 8,
    carbs: 13,
    fat: 10,
    fiber: 3,
    sodium: 310,
    serving: '1 taco',
    description: 'Seasoned beef, lettuce, and cheese in crunchy corn shell',
  },

  'Taco Bell Quesadilla (Chicken)': {
    id: 'tacobell_chicken_quesadilla',
    name: 'Chicken Quesadilla',
    restaurant: 'Taco Bell',
    category: 'Quesadillas',
    calories: 510,
    protein: 27,
    carbs: 39,
    fat: 26,
    fiber: 3,
    sodium: 1200,
    serving: '1 quesadilla',
    description: 'Grilled chicken and melted cheese in flour tortilla',
  },

  'Taco Bell Bean Burrito': {
    id: 'tacobell_bean_burrito',
    name: 'Bean Burrito',
    restaurant: 'Taco Bell',
    category: 'Burritos',
    calories: 350,
    protein: 13,
    carbs: 55,
    fat: 9,
    fiber: 9,
    sodium: 980,
    serving: '1 burrito',
    description:
      'Refried beans, onions, cheese, and red sauce in flour tortilla',
  },

  'Taco Bell Nachos BellGrande': {
    id: 'tacobell_nachos_bellgrande',
    name: 'Nachos BellGrande',
    restaurant: 'Taco Bell',
    category: 'Nachos',
    calories: 740,
    protein: 20,
    carbs: 78,
    fat: 38,
    fiber: 12,
    sodium: 1280,
    serving: '1 order',
    description:
      'Tortilla chips with seasoned beef, beans, cheese, tomatoes, sour cream',
  },

  'Taco Bell Mexican Pizza': {
    id: 'tacobell_mexican_pizza',
    name: 'Mexican Pizza',
    restaurant: 'Taco Bell',
    category: 'Specialties',
    calories: 540,
    protein: 20,
    carbs: 46,
    fat: 31,
    fiber: 7,
    sodium: 1000,
    serving: '1 pizza',
    description:
      'Seasoned beef and beans between crispy tortillas with cheese and sauce',
  },

  // =============================================================================
  // IN-N-OUT - Top Popular Items (West Coast Cult Favorite)
  // =============================================================================
  'In-N-Out Double-Double': {
    id: 'innout_double_double',
    name: 'Double-Double',
    restaurant: 'In-N-Out',
    category: 'Burgers',
    calories: 670,
    protein: 37,
    carbs: 39,
    fat: 41,
    fiber: 3,
    sodium: 1440,
    serving: '1 burger',
    description:
      'Two beef patties, two slices of cheese, lettuce, tomato, onion, spread',
  },

  'In-N-Out Hamburger': {
    id: 'innout_hamburger',
    name: 'Hamburger',
    restaurant: 'In-N-Out',
    category: 'Burgers',
    calories: 390,
    protein: 16,
    carbs: 39,
    fat: 19,
    fiber: 3,
    sodium: 650,
    serving: '1 burger',
    description:
      'Fresh beef patty, lettuce, tomato, onion, spread on toasted bun',
  },

  'In-N-Out Cheeseburger': {
    id: 'innout_cheeseburger',
    name: 'Cheeseburger',
    restaurant: 'In-N-Out',
    category: 'Burgers',
    calories: 480,
    protein: 22,
    carbs: 39,
    fat: 27,
    fiber: 3,
    sodium: 1000,
    serving: '1 burger',
    description:
      'Fresh beef patty, American cheese, lettuce, tomato, onion, spread',
  },

  'In-N-Out Protein Style Double-Double': {
    id: 'innout_protein_style_double_double',
    name: 'Protein Style Double-Double',
    restaurant: 'In-N-Out',
    category: 'Burgers',
    calories: 520,
    protein: 33,
    carbs: 11,
    fat: 39,
    fiber: 6,
    sodium: 1160,
    serving: '1 lettuce wrapped burger',
    description:
      'Two beef patties, two cheese slices wrapped in lettuce instead of bun',
  },

  'In-N-Out Animal Style Burger': {
    id: 'innout_animal_style_burger',
    name: 'Animal Style Burger',
    restaurant: 'In-N-Out',
    category: 'Burgers',
    calories: 520,
    protein: 22,
    carbs: 41,
    fat: 31,
    fiber: 3,
    sodium: 1190,
    serving: '1 burger',
    description:
      'Cheeseburger with mustard-grilled patty, pickles, grilled onions, extra spread',
  },

  'In-N-Out French Fries': {
    id: 'innout_french_fries',
    name: 'French Fries',
    restaurant: 'In-N-Out',
    category: 'Sides',
    calories: 395,
    protein: 7,
    carbs: 54,
    fat: 18,
    fiber: 2,
    sodium: 245,
    serving: '1 regular order',
    description: 'Fresh-cut potatoes cooked in 100% sunflower oil',
  },

  'In-N-Out Animal Style Fries': {
    id: 'innout_animal_style_fries',
    name: 'Animal Style Fries',
    restaurant: 'In-N-Out',
    category: 'Sides',
    calories: 750,
    protein: 18,
    carbs: 57,
    fat: 51,
    fiber: 7,
    sodium: 1690,
    serving: '1 order',
    description: 'French fries topped with cheese, grilled onions, and spread',
  },

  'In-N-Out Chocolate Shake': {
    id: 'innout_chocolate_shake',
    name: 'Chocolate Shake',
    restaurant: 'In-N-Out',
    category: 'Beverages',
    calories: 590,
    protein: 9,
    carbs: 72,
    fat: 29,
    fiber: 0,
    sodium: 350,
    serving: '1 shake (15 oz)',
    description: 'Real ice cream blended with chocolate syrup',
  },

  'In-N-Out Vanilla Shake': {
    id: 'innout_vanilla_shake',
    name: 'Vanilla Shake',
    restaurant: 'In-N-Out',
    category: 'Beverages',
    calories: 580,
    protein: 9,
    carbs: 67,
    fat: 31,
    fiber: 0,
    sodium: 390,
    serving: '1 shake (15 oz)',
    description: 'Real ice cream blended to perfection',
  },

  'In-N-Out Neapolitan Shake': {
    id: 'innout_neapolitan_shake',
    name: 'Neapolitan Shake',
    restaurant: 'In-N-Out',
    category: 'Beverages',
    calories: 590,
    protein: 9,
    carbs: 71,
    fat: 30,
    fiber: 0,
    sodium: 370,
    serving: '1 shake (15 oz)',
    description:
      'Chocolate, vanilla, and strawberry ice cream blended together',
  },
};

// Restaurant categories for filtering
export const RESTAURANT_CATEGORIES = {
  "McDonald's": ['Burgers', 'Chicken', 'Sides', 'Breakfast', 'Beverages'],
  KFC: ['Chicken', 'Sides', 'Bowls', 'Sandwiches'],
  Subway: ['Sandwiches', 'Salads', 'Sides', 'Breakfast'],
  'Pizza Hut': ['Pizza', 'Wings', 'Sides', 'Desserts'],
  'Taco Bell': ['Tacos', 'Burritos', 'Quesadillas', 'Nachos', 'Specialties'],
  'In-N-Out': ['Burgers', 'Sides', 'Beverages'],
};

// Get all restaurants
export const RESTAURANTS = Object.keys(RESTAURANT_CATEGORIES);

// Helper functions
export function getRestaurantFoods(restaurant: string) {
  return Object.values(RESTAURANT_FOODS).filter(
    (food) => food.restaurant === restaurant
  );
}

export function getFoodsByCategory(restaurant: string, category: string) {
  return Object.values(RESTAURANT_FOODS).filter(
    (food) => food.restaurant === restaurant && food.category === category
  );
}

export function searchRestaurantFoods(query: string) {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(RESTAURANT_FOODS).filter(
    (food) =>
      food.name.toLowerCase().includes(lowercaseQuery) ||
      food.restaurant.toLowerCase().includes(lowercaseQuery) ||
      food.category.toLowerCase().includes(lowercaseQuery) ||
      food.description.toLowerCase().includes(lowercaseQuery)
  );
}

// Get restaurant food by ID
export function getRestaurantFood(id: string) {
  return Object.values(RESTAURANT_FOODS).find((food) => food.id === id);
}

// Total count for display
export const RESTAURANT_FOODS_COUNT = Object.keys(RESTAURANT_FOODS).length;

export default RESTAURANT_FOODS;
