'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile, ProfileStats, UserProfileInput } from '@/types/profile';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trophy, Flag, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'achievements' | 'milestones'
  >('overview');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();

      if (data.needsSetup) {
        setNeedsSetup(true);
      } else {
        setProfile(data.profile);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: UserProfileInput) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const method = needsSetup ? 'POST' : 'PUT';

    const response = await fetch('/api/profile', {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save profile');
    }

    const result = await response.json();
    setProfile(result.profile);
    setNeedsSetup(false);
    setEditing(false);

    // Reload to get stats
    await loadProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // First-time profile setup
  if (needsSetup || editing) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          {!needsSetup && (
            <Button variant="ghost" onClick={() => setEditing(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          )}
          <h1 className="text-3xl font-bold mt-4">
            {needsSetup ? 'Set Up Your Profile' : 'Edit Profile'}
          </h1>
          {needsSetup && (
            <p className="text-muted-foreground mt-2">
              Tell us about yourself to personalize your experience and connect
              with others.
            </p>
          )}
        </div>

        <ProfileEditForm
          initialData={
            profile
              ? {
                  username: profile.username ?? undefined,
                  display_name: profile.display_name ?? undefined,
                  bio: profile.bio ?? undefined,
                  date_of_birth: profile.date_of_birth ?? undefined,
                  gender: profile.gender ?? undefined,
                  height_cm: profile.height_cm ?? undefined,
                  current_weight_lbs: profile.current_weight_lbs ?? undefined,
                  target_weight_lbs: profile.target_weight_lbs ?? undefined,
                  primary_goal: profile.primary_goal ?? undefined,
                  activity_level: profile.activity_level ?? undefined,
                  dietary_preferences: profile.dietary_preferences,
                  location: profile.location ?? undefined,
                  interests: profile.interests,
                  is_public: profile.is_public,
                  allow_friend_requests: profile.allow_friend_requests,
                  show_on_leaderboards: profile.show_on_leaderboards,
                  show_weight: profile.show_weight,
                  show_nutrition: profile.show_nutrition,
                  show_workouts: profile.show_workouts,
                  show_vitals: profile.show_vitals,
                }
              : undefined
          }
          onSave={handleSave}
          onCancel={needsSetup ? undefined : () => setEditing(false)}
          isCreating={needsSetup}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Back to Dashboard */}
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Profile Card */}
      {profile && (
        <ProfileCard
          profile={profile}
          stats={stats || undefined}
          isOwnProfile={true}
          onEdit={() => setEditing(true)}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 mt-8 mb-6 border-b">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={<Activity className="w-4 h-4" />}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeTab === 'achievements'}
          onClick={() => setActiveTab('achievements')}
          icon={<Trophy className="w-4 h-4" />}
        >
          Achievements
        </TabButton>
        <TabButton
          active={activeTab === 'milestones'}
          onClick={() => setActiveTab('milestones')}
          icon={<Flag className="w-4 h-4" />}
        >
          Milestones
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Your recent workout and nutrition activity will appear here.
              </p>
              <div className="mt-4 space-y-3">
                {stats && stats.workouts_this_month > 0 ? (
                  <p className="text-sm">
                    ✓ {stats.workouts_this_month} workouts this month
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No workouts logged this month
                  </p>
                )}
                {stats && stats.total_days_logged > 0 ? (
                  <p className="text-sm">
                    ✓ {stats.total_days_logged} days of nutrition logged
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No nutrition data logged yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/diet" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🍎 Log Today's Meals
                </Button>
              </Link>
              <Link href="/dashboard/exercise" className="block">
                <Button variant="outline" className="w-full justify-start">
                  💪 Log a Workout
                </Button>
              </Link>
              <Link href="/community" className="block">
                <Button variant="outline" className="w-full justify-start">
                  👥 Find Friends
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'achievements' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Achievements will be unlocked as you continue your health journey.
              Keep logging workouts and meals to earn badges!
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-6">
              {/* Placeholder achievements */}
              <AchievementPlaceholder emoji="🎯" name="First Workout" locked />
              <AchievementPlaceholder emoji="🔥" name="7-Day Streak" locked />
              <AchievementPlaceholder emoji="💪" name="10 Workouts" locked />
              <AchievementPlaceholder emoji="🥗" name="Healthy Eater" locked />
              <AchievementPlaceholder emoji="🏆" name="Goal Reached" locked />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'milestones' && (
        <Card>
          <CardHeader>
            <CardTitle>Health Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Record your health journey milestones to track progress and share
              with friends.
            </p>
            <Button>
              <Flag className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function AchievementPlaceholder({
  emoji,
  name,
  locked,
}: {
  emoji: string;
  name: string;
  locked?: boolean;
}) {
  return (
    <div className={`text-center p-4 rounded-lg ${locked ? 'opacity-40' : ''}`}>
      <div className="text-3xl mb-2">{emoji}</div>
      <p className="text-xs text-muted-foreground">{name}</p>
      {locked && <p className="text-xs text-muted-foreground">🔒</p>}
    </div>
  );
}
