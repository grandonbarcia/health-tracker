# User Profile Feature - Implementation Plan

## 📋 Overview

Create a comprehensive user profile system that allows users to:

1. **Set up personal profiles** with customizable data
2. **Connect with other users** through search and discovery
3. **View and compare health journeys** with friends/community
4. **Control privacy settings** for what data is publicly visible

---

## 🗂️ Phase 1: Database Schema Design

### 1.1 Create `user_profiles` Table

```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Basic Info
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,

  -- Personal Health Info (for customization)
  date_of_birth DATE,
  gender VARCHAR(20),
  height_cm NUMERIC,
  current_weight_lbs NUMERIC,
  target_weight_lbs NUMERIC,

  -- Fitness Goals
  primary_goal VARCHAR(50), -- 'lose_weight', 'gain_muscle', 'maintain', 'improve_health', 'athletic_performance'
  activity_level VARCHAR(30), -- 'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
  dietary_preferences JSONB DEFAULT '[]'::jsonb, -- ['vegetarian', 'vegan', 'keto', 'gluten_free', etc.]

  -- Social/Discovery
  location VARCHAR(100),
  interests JSONB DEFAULT '[]'::jsonb, -- ['running', 'weightlifting', 'yoga', etc.]
  is_public BOOLEAN DEFAULT false,
  allow_friend_requests BOOLEAN DEFAULT true,
  show_on_leaderboards BOOLEAN DEFAULT true,

  -- Stats Visibility (what others can see)
  show_weight BOOLEAN DEFAULT false,
  show_nutrition BOOLEAN DEFAULT true,
  show_workouts BOOLEAN DEFAULT true,
  show_vitals BOOLEAN DEFAULT false,
  show_progress_photos BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read public profiles"
  ON user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 1.2 Create `user_connections` Table (Friends/Following)

```sql
CREATE TABLE user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see their own connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create connection requests"
  ON user_connections FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update connections they're part of"
  ON user_connections FOR UPDATE
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can delete their own connections"
  ON user_connections FOR DELETE
  USING (auth.uid() = follower_id OR auth.uid() = following_id);
```

### 1.3 Create `user_achievements` Table

```sql
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type VARCHAR(50) NOT NULL, -- 'streak', 'goal_reached', 'milestone', etc.
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data like values, counts, etc.

  UNIQUE(user_id, achievement_type, achievement_name)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public achievements visible to connected users"
  ON user_achievements FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = user_achievements.user_id
      AND user_profiles.is_public = true
    ) OR
    EXISTS (
      SELECT 1 FROM user_connections
      WHERE status = 'accepted'
      AND (
        (follower_id = auth.uid() AND following_id = user_achievements.user_id) OR
        (following_id = auth.uid() AND follower_id = user_achievements.user_id)
      )
    )
  );
```

### 1.4 Create `health_milestones` Table (Shareable Progress)

```sql
CREATE TABLE health_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  milestone_type VARCHAR(50) NOT NULL, -- 'weight_loss', 'workout_streak', 'nutrition_goal', etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  value NUMERIC,
  unit VARCHAR(30),
  achieved_at DATE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE health_milestones ENABLE ROW LEVEL SECURITY;
```

---

## 🗂️ Phase 2: TypeScript Types & API Routes

### 2.1 Create Types File: `src/types/profile.ts`

```typescript
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

export interface UserConnection {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  // Joined data
  follower_profile?: UserProfile;
  following_profile?: UserProfile;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  achieved_at: string;
  metadata: Record<string, any>;
}

export interface HealthMilestone {
  id: string;
  user_id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  value: number | null;
  unit: string | null;
  achieved_at: string;
  is_public: boolean;
  created_at: string;
}

export interface UserSearchResult {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  primary_goal: string | null;
  interests: string[];
  connection_status: 'none' | 'pending' | 'accepted' | 'blocked' | 'self';
}

export interface PublicHealthSummary {
  profile: Partial<UserProfile>;
  stats: {
    workout_count_30_days: number;
    current_streak: number;
    total_workouts: number;
  };
  achievements: UserAchievement[];
  milestones: HealthMilestone[];
}

export interface ComparisonData {
  your_stats: HealthStats;
  their_stats: HealthStats;
  differences: HealthStatsDiff;
}

export interface HealthStats {
  avg_daily_calories: number;
  avg_daily_protein: number;
  workouts_per_week: number;
  current_streak: number;
  total_workout_minutes: number;
}

export interface HealthStatsDiff {
  calories_diff: number;
  protein_diff: number;
  workouts_diff: number;
  streak_diff: number;
}
```

### 2.2 API Routes to Create

| Route                             | Method   | Description                                 |
| --------------------------------- | -------- | ------------------------------------------- |
| `/api/profile`                    | GET      | Get current user's profile                  |
| `/api/profile`                    | PUT      | Update current user's profile               |
| `/api/profile`                    | POST     | Create initial profile (on first login)     |
| `/api/profile/[username]`         | GET      | Get public profile by username              |
| `/api/profile/search`             | GET      | Search for users by name/username/interests |
| `/api/connections`                | GET      | Get user's connections (friends/following)  |
| `/api/connections`                | POST     | Send connection request                     |
| `/api/connections/[id]`           | PUT      | Accept/reject connection request            |
| `/api/connections/[id]`           | DELETE   | Remove connection                           |
| `/api/profile/[username]/stats`   | GET      | Get public health stats for comparison      |
| `/api/profile/compare/[username]` | GET      | Compare your stats with another user        |
| `/api/achievements`               | GET      | Get user's achievements                     |
| `/api/milestones`                 | GET/POST | Manage health milestones                    |

---

## 🗂️ Phase 3: UI Components

### 3.1 New Pages to Create

```
src/app/
├── profile/
│   ├── page.tsx                    # Own profile view/edit
│   ├── setup/
│   │   └── page.tsx               # First-time profile setup wizard
│   └── [username]/
│       └── page.tsx               # View other user's profile
├── community/
│   ├── page.tsx                   # User search & discovery
│   ├── connections/
│   │   └── page.tsx              # Manage friends/following
│   └── compare/
│       └── [username]/
│           └── page.tsx          # Side-by-side comparison view
```

### 3.2 New Components to Create

| Component                 | Purpose                                                 |
| ------------------------- | ------------------------------------------------------- |
| `ProfileCard.tsx`         | Display user profile summary (avatar, name, bio, stats) |
| `ProfileEditForm.tsx`     | Form for editing profile details                        |
| `ProfileSetupWizard.tsx`  | Multi-step onboarding for new users                     |
| `UserSearchBar.tsx`       | Search input with autocomplete for finding users        |
| `UserSearchResults.tsx`   | Grid/list of user search results                        |
| `ConnectionButton.tsx`    | Follow/unfollow/pending state button                    |
| `ConnectionsList.tsx`     | List of user's connections with actions                 |
| `ConnectionRequests.tsx`  | Pending connection requests with accept/reject          |
| `PrivacySettingsForm.tsx` | Toggle switches for privacy controls                    |
| `AchievementBadge.tsx`    | Display individual achievement                          |
| `AchievementsGrid.tsx`    | Grid of user's earned achievements                      |
| `MilestoneCard.tsx`       | Display a health milestone                              |
| `MilestoneTimeline.tsx`   | Timeline view of milestones                             |
| `ComparisonChart.tsx`     | Side-by-side chart comparing two users                  |
| `StatsComparison.tsx`     | Table/visual comparison of health stats                 |
| `PublicProfileView.tsx`   | Read-only view of another user's profile                |
| `ActivityFeed.tsx`        | Feed of friend's activities/milestones                  |

### 3.3 Update Existing Components

| Component         | Changes                                                      |
| ----------------- | ------------------------------------------------------------ |
| `Navbar.tsx`      | Add profile link, notification badge for connection requests |
| `WorkoutCard.tsx` | Add "Share" button for public milestones                     |
| Dashboard pages   | Add "Share Progress" options                                 |

---

## 🗂️ Phase 4: Feature Implementation Order

### Sprint 1: Core Profile (Week 1)

1. ✅ Create database tables with migrations
2. ✅ Create TypeScript types
3. ✅ Implement `/api/profile` routes
4. ✅ Create `ProfileCard` component
5. ✅ Create profile page (`/profile`)
6. ✅ Create `ProfileEditForm` component
7. ✅ Add profile link to Navbar

### Sprint 2: Profile Setup & Personalization (Week 2)

1. ✅ Create `ProfileSetupWizard` component
2. ✅ Create setup page (`/profile/setup`)
3. ✅ Detect first-time users and redirect to setup
4. ✅ Implement goal-based recommendations (connect to existing recommendation system)
5. ✅ Update user settings to sync with profile data
6. ✅ Create `PrivacySettingsForm` component

### Sprint 3: User Discovery & Search (Week 3)

1. ✅ Implement `/api/profile/search` endpoint
2. ✅ Create `UserSearchBar` component with debounced search
3. ✅ Create `UserSearchResults` component
4. ✅ Create community page (`/community`)
5. ✅ Create `PublicProfileView` component
6. ✅ Create public profile page (`/profile/[username]`)

### Sprint 4: Connections System (Week 4)

1. ✅ Implement `/api/connections` routes
2. ✅ Create `ConnectionButton` component
3. ✅ Create `ConnectionsList` component
4. ✅ Create `ConnectionRequests` component
5. ✅ Create connections page (`/community/connections`)
6. ✅ Add notification badge to Navbar

### Sprint 5: Achievements & Milestones (Week 5)

1. ✅ Create achievement system logic
2. ✅ Implement automatic achievement detection
3. ✅ Create `AchievementBadge` and `AchievementsGrid` components
4. ✅ Create `MilestoneCard` and `MilestoneTimeline` components
5. ✅ Add milestone sharing functionality

### Sprint 6: Comparison & Social Features (Week 6)

1. ✅ Implement `/api/profile/compare` endpoint
2. ✅ Create comparison page (`/community/compare/[username]`)
3. ✅ Create `ComparisonChart` and `StatsComparison` components
4. ✅ Create `ActivityFeed` component
5. ✅ Polish and testing

---

## 🗂️ Phase 5: Detailed Component Specifications

### 5.1 Profile Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  PROFILE HEADER                                              │
│  ┌─────────┐  Display Name         [Edit Profile]            │
│  │ Avatar  │  @username                                      │
│  │         │  📍 Location  |  🎯 Goal  |  🏃 Activity Level  │
│  └─────────┘  "Bio text here..."                            │
├─────────────────────────────────────────────────────────────┤
│  STATS CARDS ROW                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Workouts │ │ Current  │ │  Avg     │ │ Friends  │        │
│  │    42    │ │ Streak   │ │ Calories │ │    15    │        │
│  │ this mo  │ │  7 days  │ │  1,850   │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│  TABS: [Achievements] [Milestones] [Activity] [Settings]    │
│                                                              │
│  Achievement Grid / Milestone Timeline / Activity Feed       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 User Search Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  COMMUNITY                                        [Filters]  │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search users by name, username, or interests...         │
├─────────────────────────────────────────────────────────────┤
│  FILTER CHIPS: [All] [Same Goal] [Near Me] [Similar Stats]  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│  │ User Card 1     │ │ User Card 2     │ │ User Card 3    │ │
│  │ Avatar + Name   │ │ Avatar + Name   │ │ Avatar + Name  │ │
│  │ Goal + Interests│ │ Goal + Interests│ │ Goal + Interest│ │
│  │ [Connect]       │ │ [Pending...]    │ │ [Friends ✓]    │ │
│  └─────────────────┘ └─────────────────┘ └────────────────┘ │
│  ... more results ...                                        │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Comparison View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  COMPARE PROGRESS                                            │
├──────────────────────────┬──────────────────────────────────┤
│       YOU                │         @username                │
│  ┌─────────┐            │    ┌─────────┐                    │
│  │ Avatar  │            │    │ Avatar  │                    │
│  └─────────┘            │    └─────────┘                    │
├──────────────────────────┴──────────────────────────────────┤
│  COMPARISON CHART (side by side bars)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Avg Calories:  ████████████  1,850                    │  │
│  │                ██████████████  2,100                  │  │
│  │ Protein:       ██████████████  140g                   │  │
│  │                ████████████  125g                     │  │
│  │ Workouts/Week: ████████  4                            │  │
│  │                ██████████████  6                      │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ACHIEVEMENTS COMPARISON                                     │
│  Common: 🏆🏅🎖️   |   Unique to you: 🥇   |   Theirs: 🥈🥉 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Phase 6: Security & Privacy Considerations

### 6.1 Row Level Security (RLS) Rules

1. **Own Profile**: Users can always read/update their own profile
2. **Public Profiles**: Anyone can view profiles where `is_public = true`
3. **Connected Users**: Friends can see more detailed stats (based on privacy settings)
4. **Blocked Users**: Cannot see any data from blocked users

### 6.2 Privacy Controls

| Setting                 | Default | Description                                   |
| ----------------------- | ------- | --------------------------------------------- |
| `is_public`             | false   | Allow anyone to find and view profile         |
| `allow_friend_requests` | true    | Allow other users to send connection requests |
| `show_on_leaderboards`  | true    | Appear in community leaderboards              |
| `show_weight`           | false   | Display weight on public profile              |
| `show_nutrition`        | true    | Display nutrition stats publicly              |
| `show_workouts`         | true    | Display workout stats publicly                |
| `show_vitals`           | false   | Display vital signs publicly                  |

### 6.3 Data Sanitization

- Sanitize all user inputs (bio, display_name, etc.)
- Validate username format (alphanumeric, underscores, 3-30 chars)
- Rate limit profile search requests
- Prevent enumeration attacks on usernames

---

## 🗂️ Phase 7: Future Enhancements (Post-MVP)

1. **Progress Photos** - Before/after photo sharing with privacy controls
2. **Challenges** - Create or join group challenges with friends
3. **Leaderboards** - Weekly/monthly leaderboards by category
4. **Activity Feed** - Real-time feed of friend activities
5. **Direct Messaging** - Private chat between connected users
6. **Groups/Communities** - Create interest-based groups
7. **Coach/Client Mode** - Allow fitness coaches to monitor clients
8. **Export/Share** - Generate shareable progress reports

---

## 📁 File Structure Summary

```
src/
├── app/
│   ├── profile/
│   │   ├── page.tsx
│   │   ├── setup/
│   │   │   └── page.tsx
│   │   └── [username]/
│   │       └── page.tsx
│   ├── community/
│   │   ├── page.tsx
│   │   ├── connections/
│   │   │   └── page.tsx
│   │   └── compare/
│   │       └── [username]/
│   │           └── page.tsx
│   └── api/
│       ├── profile/
│       │   ├── route.ts
│       │   ├── search/
│       │   │   └── route.ts
│       │   └── [username]/
│       │       ├── route.ts
│       │       └── stats/
│       │           └── route.ts
│       ├── connections/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── achievements/
│       │   └── route.ts
│       └── milestones/
│           └── route.ts
├── components/
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileEditForm.tsx
│   │   ├── ProfileSetupWizard.tsx
│   │   ├── PrivacySettingsForm.tsx
│   │   ├── PublicProfileView.tsx
│   │   ├── AchievementBadge.tsx
│   │   ├── AchievementsGrid.tsx
│   │   ├── MilestoneCard.tsx
│   │   └── MilestoneTimeline.tsx
│   └── community/
│       ├── UserSearchBar.tsx
│       ├── UserSearchResults.tsx
│       ├── ConnectionButton.tsx
│       ├── ConnectionsList.tsx
│       ├── ConnectionRequests.tsx
│       ├── ComparisonChart.tsx
│       ├── StatsComparison.tsx
│       └── ActivityFeed.tsx
├── types/
│   └── profile.ts
├── lib/
│   └── profileUtils.ts
└── scripts/
    └── create-profile-tables.sql
```

---

## ✅ Ready to Implement

This plan provides a comprehensive roadmap for implementing the user profile feature. The implementation is broken into 6 sprints, each buildable incrementally.

**Recommended starting point**: Begin with Sprint 1 (Core Profile) to establish the database schema and basic profile viewing/editing functionality, then progressively add social features.

Would you like me to start implementing any specific phase?
