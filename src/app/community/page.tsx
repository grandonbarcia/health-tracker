'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { UserSearch } from '@/components/community/UserSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Users, UserPlus, Bell } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth');
      return;
    }
    setUser(session.user);
    await loadPendingCount(session.access_token);
    setLoading(false);
  };

  const loadPendingCount = async (token: string) => {
    try {
      const response = await fetch('/api/connections?type=pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pendingCount || 0);
      }
    } catch (error) {
      console.error('Error loading pending count:', error);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground">
            Find and connect with people who share your health goals
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/community/connections">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              My Connections
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline">My Profile</Button>
          </Link>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {pendingCount > 0 && (
        <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-500" />
                <p>
                  You have <strong>{pendingCount}</strong> pending connection
                  request{pendingCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Link href="/community/connections?tab=pending">
                <Button size="sm">View Requests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Find People
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserSearch onConnect={handleConnect} />
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">💡 Tips for Connecting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Complete Your Profile</h4>
              <p className="text-sm text-muted-foreground">
                Users with complete profiles get 3x more connection requests.
                Add your goals, interests, and a bio.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Find Similar Goals</h4>
              <p className="text-sm text-muted-foreground">
                Use filters to find people with the same fitness goals. You'll
                have more in common to discuss!
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stay Accountable</h4>
              <p className="text-sm text-muted-foreground">
                Connect with friends to see each other's progress. Having
                workout buddies increases success by 95%!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
