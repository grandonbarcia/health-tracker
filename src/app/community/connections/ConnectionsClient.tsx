'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { UserConnection, UserProfile } from '@/types/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  Target,
} from 'lucide-react';
import Link from 'next/link';

interface EnrichedConnection extends UserConnection {
  profile?: Partial<UserProfile>;
  is_follower: boolean;
  is_following: boolean;
}

export default function ConnectionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<EnrichedConnection[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending') {
      setActiveTab('pending');
    }
    loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadConnections = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      // Load all connections
      const response = await fetch('/api/connections?status=all', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load connections');

      const data = await response.json();
      setConnections(data.connections || []);
      setPendingCount(data.pendingCount || 0);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    connectionId: string,
    action: 'accept' | 'reject' | 'remove'
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      if (action === 'remove') {
        await fetch(`/api/connections/${connectionId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } else {
        await fetch(`/api/connections/${connectionId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });
      }

      // Reload connections
      await loadConnections();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const acceptedConnections = connections.filter(
    (c) => c.status === 'accepted'
  );
  // Pending requests RECEIVED - where someone else is following the current user
  const pendingConnections = connections.filter(
    (c) => c.status === 'pending' && c.is_follower === true
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link href="/community">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Connections</h1>
        <p className="text-muted-foreground">
          Manage your friends and connection requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Connections ({acceptedConnections.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <div>
          {acceptedConnections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start connecting with people who share your health goals!
                </p>
                <Link href="/community">
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find People
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {acceptedConnections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onRemove={() => handleAction(connection.id, 'remove')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div>
          {pendingConnections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No pending requests
                </h3>
                <p className="text-muted-foreground">
                  Connection requests from other users will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingConnections.map((connection) => (
                <PendingRequestCard
                  key={connection.id}
                  connection={connection}
                  onAccept={() => handleAction(connection.id, 'accept')}
                  onReject={() => handleAction(connection.id, 'reject')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectionCard({
  connection,
  onRemove,
}: {
  connection: EnrichedConnection;
  onRemove: () => void;
}) {
  const profile = connection.profile;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/profile/${profile?.username}`}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
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
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${profile?.username}`}>
              <h3 className="font-semibold truncate hover:text-primary cursor-pointer">
                {profile?.display_name || profile?.username || 'Unknown User'}
              </h3>
            </Link>
            {profile?.username && (
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
            )}
            {profile?.primary_goal && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {profile.primary_goal.replace('_', ' ')}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link href={`/profile/${profile?.username}`}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <UserX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingRequestCard({
  connection,
  onAccept,
  onReject,
}: {
  connection: EnrichedConnection;
  onAccept: () => void;
  onReject: () => void;
}) {
  const profile = connection.profile;
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await onAccept();
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject();
    setLoading(false);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/profile/${profile?.username}`}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
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
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${profile?.username}`}>
              <h3 className="font-semibold truncate hover:text-primary cursor-pointer">
                {profile?.display_name || profile?.username || 'Unknown User'}
              </h3>
            </Link>
            {profile?.username && (
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Wants to connect with you
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={loading}
            >
              <UserX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
