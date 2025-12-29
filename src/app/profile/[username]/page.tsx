'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  UserProfile,
  ProfileStats,
  UserAchievement,
  HealthMilestone,
  PRIMARY_GOAL_OPTIONS,
} from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectionButton } from '@/components/community/ConnectionButton';
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Target,
  Activity,
  Calendar,
  Dumbbell,
  Apple,
  Lock,
  Trophy,
  Flag,
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [milestones, setMilestones] = useState<HealthMilestone[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/profile/${username}`, { headers });

      if (response.status === 404) {
        setError('User not found');
        return;
      }

      if (response.status === 403) {
        setError('This profile is private');
        return;
      }

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();
      setProfile(data.profile);
      setStats(data.stats);
      setAchievements(data.achievements || []);
      setMilestones(data.milestones || []);
      setConnectionStatus(data.connectionStatus);
      setIsOwnProfile(data.isOwnProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }

    const response = await fetch('/api/connections', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send connection request');
    }

    setConnectionStatus('pending_sent');
  };

  const goalLabel = profile?.primary_goal
    ? PRIMARY_GOAL_OPTIONS.find((g) => g.value === profile.primary_goal)?.label
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="text-6xl mb-4">
          {error === 'User not found' ? '🔍' : '🔒'}
        </div>
        <h1 className="text-2xl font-bold mb-2">{error}</h1>
        <p className="text-muted-foreground mb-6">
          {error === 'User not found'
            ? "The user you're looking for doesn't exist."
            : 'This user has set their profile to private.'}
        </p>
        <Link href="/community">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </Link>
      </div>
    );
  }

  if (isOwnProfile) {
    router.push('/profile');
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Back Button */}
      <Link href="/community">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>
      </Link>

      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || profile.username || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (
                  profile?.display_name?.[0] ||
                  profile?.username?.[0] ||
                  'U'
                ).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile?.display_name ||
                      profile?.username ||
                      'Anonymous User'}
                  </h1>
                  {profile?.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    {profile?.location && (
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
                  </div>
                </div>

                {/* Connection Button */}
                <ConnectionButton
                  userId={profile?.user_id || ''}
                  status={connectionStatus as any}
                  onConnect={handleConnect}
                />
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-muted-foreground mt-4">{profile.bio}</p>
              )}

              {/* Interests */}
              {profile?.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.total_workouts !== undefined && (
            <StatCard
              icon={<Dumbbell className="w-5 h-5 text-blue-500" />}
              label="Total Workouts"
              value={stats.total_workouts}
            />
          )}
          {stats.workouts_this_month !== undefined && (
            <StatCard
              icon={<Calendar className="w-5 h-5 text-green-500" />}
              label="This Month"
              value={stats.workouts_this_month}
            />
          )}
          {stats.total_days_logged !== undefined && (
            <StatCard
              icon={<Apple className="w-5 h-5 text-orange-500" />}
              label="Days Logged"
              value={stats.total_days_logged}
            />
          )}
          {stats.member_since && (
            <StatCard
              icon={<Activity className="w-5 h-5 text-purple-500" />}
              label="Member Since"
              value={new Date(stats.member_since).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            />
          )}
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="text-center p-3">
                  <div className="text-2xl mb-1">
                    {achievement.metadata?.icon || '🏆'}
                  </div>
                  <p className="text-xs font-medium">
                    {achievement.achievement_name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-4 p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-medium">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(milestone.achieved_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
