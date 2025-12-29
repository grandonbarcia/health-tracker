// TypeScript types for user profiles and social features

// =============================================
// ENUMS & CONSTANTS
// =============================================

export type PrimaryGoal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'maintain'
  | 'improve_health'
  | 'athletic_performance';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type ConnectionStatus = 'pending' | 'accepted' | 'blocked';

export type AchievementType =
  | 'streak'
  | 'goal_reached'
  | 'milestone'
  | 'workout_count'
  | 'nutrition_goal'
  | 'first_action';

export type MilestoneType =
  | 'weight_loss'
  | 'weight_gain'
  | 'workout_streak'
  | 'nutrition_goal'
  | 'personal_record'
  | 'custom';

// =============================================
// USER PROFILE
// =============================================

export interface UserProfile {
  id: string;
  user_id: string;

  // Basic Info
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;

  // Personal Health Info
  date_of_birth: string | null;
  gender: string | null;
  height_cm: number | null;
  current_weight_lbs: number | null;
  target_weight_lbs: number | null;

  // Fitness Goals
  primary_goal: PrimaryGoal | null;
  activity_level: ActivityLevel | null;
  dietary_preferences: string[];

  // Social/Discovery
  location: string | null;
  interests: string[];
  is_public: boolean;
  allow_friend_requests: boolean;
  show_on_leaderboards: boolean;

  // Privacy Settings
  show_weight: boolean;
  show_nutrition: boolean;
  show_workouts: boolean;
  show_vitals: boolean;
  show_progress_photos: boolean;

  created_at: string;
  updated_at: string;
}

export interface UserProfileInput {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  current_weight_lbs?: number;
  target_weight_lbs?: number;
  primary_goal?: PrimaryGoal;
  activity_level?: ActivityLevel;
  dietary_preferences?: string[];
  location?: string;
  interests?: string[];
  is_public?: boolean;
  allow_friend_requests?: boolean;
  show_on_leaderboards?: boolean;
  show_weight?: boolean;
  show_nutrition?: boolean;
  show_workouts?: boolean;
  show_vitals?: boolean;
  show_progress_photos?: boolean;
}

// =============================================
// USER CONNECTIONS
// =============================================

export interface UserConnection {
  id: string;
  follower_id: string;
  following_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  // Joined data (populated by API)
  follower_profile?: UserProfile;
  following_profile?: UserProfile;
}

export interface ConnectionRequest {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

// =============================================
// ACHIEVEMENTS
// =============================================

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achievement_name: string;
  achievement_description: string | null;
  achieved_at: string;
  metadata: Record<string, any>;
}

export const ACHIEVEMENT_DEFINITIONS: Record<
  string,
  { name: string; description: string; icon: string }
> = {
  // Streak achievements
  streak_7: {
    name: '7-Day Streak',
    description: 'Logged activity for 7 consecutive days',
    icon: '🔥',
  },
  streak_30: {
    name: '30-Day Streak',
    description: 'Logged activity for 30 consecutive days',
    icon: '💪',
  },
  streak_100: {
    name: '100-Day Streak',
    description: 'Logged activity for 100 consecutive days',
    icon: '🏆',
  },

  // Workout achievements
  first_workout: {
    name: 'First Workout',
    description: 'Completed your first workout',
    icon: '🎯',
  },
  workouts_10: {
    name: '10 Workouts',
    description: 'Completed 10 workouts',
    icon: '💪',
  },
  workouts_50: {
    name: '50 Workouts',
    description: 'Completed 50 workouts',
    icon: '🏋️',
  },
  workouts_100: {
    name: 'Century Club',
    description: 'Completed 100 workouts',
    icon: '🥇',
  },

  // Nutrition achievements
  first_log: {
    name: 'First Log',
    description: 'Logged your first meal',
    icon: '📝',
  },
  protein_goal_7: {
    name: 'Protein Champion',
    description: 'Hit protein goal 7 days in a row',
    icon: '🥩',
  },
  calorie_goal_7: {
    name: 'Calorie Master',
    description: 'Hit calorie goal 7 days in a row',
    icon: '⚡',
  },

  // Social achievements
  first_friend: {
    name: 'Social Butterfly',
    description: 'Made your first connection',
    icon: '🤝',
  },
  friends_10: {
    name: 'Growing Network',
    description: 'Connected with 10 people',
    icon: '🌐',
  },

  // Profile achievements
  profile_complete: {
    name: 'Profile Pro',
    description: 'Completed your profile',
    icon: '✨',
  },
  went_public: {
    name: 'Open Book',
    description: 'Made your profile public',
    icon: '📖',
  },
};

// =============================================
// MILESTONES
// =============================================

export interface HealthMilestone {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  title: string;
  description: string | null;
  value: number | null;
  unit: string | null;
  achieved_at: string;
  is_public: boolean;
  created_at: string;
}

export interface HealthMilestoneInput {
  milestone_type: MilestoneType;
  title: string;
  description?: string;
  value?: number;
  unit?: string;
  achieved_at: string;
  is_public?: boolean;
}

// =============================================
// SEARCH & DISCOVERY
// =============================================

export interface UserSearchResult {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  primary_goal: PrimaryGoal | null;
  interests: string[];
  connection_status:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'accepted'
    | 'blocked'
    | 'self';
}

export interface UserSearchFilters {
  query?: string;
  primary_goal?: PrimaryGoal;
  interests?: string[];
  location?: string;
  limit?: number;
  offset?: number;
}

// =============================================
// PROFILE STATS & COMPARISON
// =============================================

export interface ProfileStats {
  total_workouts: number;
  workouts_this_month: number;
  total_days_logged: number;
  current_streak: number;
  member_since: string | null;
  avg_daily_calories?: number;
  avg_daily_protein?: number;
}

export interface PublicHealthSummary {
  profile: Partial<UserProfile>;
  stats: ProfileStats;
  achievements: UserAchievement[];
  milestones: HealthMilestone[];
}

export interface ComparisonData {
  your_stats: ProfileStats;
  their_stats: ProfileStats;
  your_profile: Partial<UserProfile>;
  their_profile: Partial<UserProfile>;
}

// =============================================
// UI HELPER TYPES
// =============================================

export interface ProfileTab {
  id: 'overview' | 'achievements' | 'milestones' | 'activity' | 'settings';
  label: string;
  icon?: string;
}

export const PROFILE_TABS: ProfileTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

export const PRIMARY_GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'gain_muscle', label: 'Build Muscle' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'improve_health', label: 'Improve Health' },
  { value: 'athletic_performance', label: 'Athletic Performance' },
];

export const ACTIVITY_LEVEL_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise',
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
  },
  {
    value: 'moderately_active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
  },
  {
    value: 'extremely_active',
    label: 'Extremely Active',
    description: 'Very hard exercise & physical job',
  },
];

export const DIETARY_PREFERENCE_OPTIONS: string[] = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
  'High-Protein',
  'Mediterranean',
  'Whole30',
  'Intermittent Fasting',
];

export const INTEREST_OPTIONS: string[] = [
  'Running',
  'Weightlifting',
  'Yoga',
  'CrossFit',
  'Swimming',
  'Cycling',
  'HIIT',
  'Pilates',
  'Martial Arts',
  'Rock Climbing',
  'Hiking',
  'Dance',
  'Calisthenics',
  'Bodybuilding',
  'Powerlifting',
  'Sports',
  'Walking',
  'Stretching',
];
