'use client';

import {
  UserProfile,
  ProfileStats,
  PRIMARY_GOAL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
} from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  Target,
  Activity,
  Calendar,
  Dumbbell,
  Apple,
  Users,
  Edit,
  Settings,
} from 'lucide-react';

interface ProfileCardProps {
  profile: UserProfile | Partial<UserProfile>;
  stats?: ProfileStats;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onSettings?: () => void;
  compact?: boolean;
}

export function ProfileCard({
  profile,
  stats,
  isOwnProfile = false,
  onEdit,
  onSettings,
  compact = false,
}: ProfileCardProps) {
  const goalLabel = profile.primary_goal
    ? PRIMARY_GOAL_OPTIONS.find((g) => g.value === profile.primary_goal)?.label
    : null;

  const activityLabel = profile.activity_level
    ? ACTIVITY_LEVEL_OPTIONS.find((a) => a.value === profile.activity_level)
        ?.label
    : null;

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (
                  profile.display_name?.[0] ||
                  profile.username?.[0] ||
                  'U'
                ).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {profile.display_name || profile.username || 'Anonymous'}
              </h3>
              {profile.username && (
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              )}
              {goalLabel && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {goalLabel}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (
                  profile.display_name?.[0] ||
                  profile.username?.[0] ||
                  'U'
                ).toUpperCase()
              )}
            </div>

            {/* Basic Info */}
            <div>
              <CardTitle className="text-2xl">
                {profile.display_name || profile.username || 'Anonymous User'}
              </CardTitle>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </span>
                )}
                {goalLabel && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {goalLabel}
                  </span>
                )}
                {activityLabel && (
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {activityLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {onSettings && (
                <Button variant="ghost" size="sm" onClick={onSettings}>
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Bio */}
        {profile.bio && (
          <p className="text-muted-foreground mb-6">{profile.bio}</p>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Dumbbell className="w-5 h-5 text-blue-500" />}
              label="Workouts"
              value={stats.total_workouts}
            />
            <StatCard
              icon={<Calendar className="w-5 h-5 text-green-500" />}
              label="This Month"
              value={stats.workouts_this_month}
            />
            <StatCard
              icon={<Apple className="w-5 h-5 text-orange-500" />}
              label="Days Logged"
              value={stats.total_days_logged}
            />
            <StatCard
              icon={<Users className="w-5 h-5 text-purple-500" />}
              label="Streak"
              value={`${stats.current_streak} days`}
            />
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Preferences */}
        {profile.dietary_preferences &&
          profile.dietary_preferences.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Dietary Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {profile.dietary_preferences.map((pref, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Member Since */}
        {stats?.member_since && (
          <p className="text-sm text-muted-foreground mt-6">
            Member since{' '}
            {new Date(stats.member_since).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
      {icon}
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default ProfileCard;
