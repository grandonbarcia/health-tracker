'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserSearchResult,
  UserSearchFilters,
  PRIMARY_GOAL_OPTIONS,
} from '@/types/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectionButton } from './ConnectionButton';
import { Search, Filter, X, Loader2, Users, Target } from 'lucide-react';
import Link from 'next/link';

interface UserSearchProps {
  onConnect: (userId: string) => Promise<void>;
}

export function UserSearch({ onConnect }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [searched, setSearched] = useState(false);

  const searchUsers = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (filters.primary_goal) params.set('goal', filters.primary_goal);
      if (filters.location) params.set('location', filters.location);
      if (filters.interests?.length)
        params.set('interests', filters.interests.join(','));

      const token =
        localStorage.getItem('supabase_token') ||
        (
          await (
            await import('@/lib/supabaseClient')
          ).supabase.auth.getSession()
        ).data.session?.access_token;

      const response = await fetch(`/api/profile/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.users || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  // Load users on mount
  useEffect(() => {
    searchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search when query or filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, filters, searchUsers]);

  const clearFilters = () => {
    setFilters({});
    setQuery('');
  };

  const hasActiveFilters =
    filters.primary_goal ||
    filters.location ||
    (filters.interests?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or username..."
          className="w-full pl-10 pr-10 py-3 border rounded-lg bg-background text-lg"
        />
        {(query || hasActiveFilters) && (
          <button
            onClick={clearFilters}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? 'border-primary' : ''}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {
                [
                  filters.primary_goal,
                  filters.location,
                  ...(filters.interests || []),
                ].filter(Boolean).length
              }
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Goal</label>
              <div className="flex flex-wrap gap-2">
                {PRIMARY_GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() =>
                      setFilters({
                        ...filters,
                        primary_goal:
                          filters.primary_goal === goal.value
                            ? undefined
                            : goal.value,
                      })
                    }
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.primary_goal === goal.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={filters.location || ''}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                placeholder="City or country..."
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((user) => (
            <UserResultCard
              key={user.user_id}
              user={user}
              onConnect={onConnect}
            />
          ))}
        </div>
      ) : searched ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or adjust filters
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Search for users to connect with
          </p>
          <p className="text-sm text-muted-foreground">
            Find people with similar health goals
          </p>
        </div>
      )}
    </div>
  );
}

function UserResultCard({
  user,
  onConnect,
}: {
  user: UserSearchResult;
  onConnect: (userId: string) => Promise<void>;
}) {
  const goalLabel = user.primary_goal
    ? PRIMARY_GOAL_OPTIONS.find((g) => g.value === user.primary_goal)?.label
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/profile/${user.username}`}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (user.display_name?.[0] || user.username[0]).toUpperCase()
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.username}`}>
              <h3 className="font-semibold truncate hover:text-primary cursor-pointer">
                {user.display_name || user.username}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">@{user.username}</p>

            {goalLabel && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {goalLabel}
              </p>
            )}

            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}

            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.interests.slice(0, 3).map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                  >
                    {interest}
                  </span>
                ))}
                {user.interests.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{user.interests.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Connection Button */}
        <div className="mt-4">
          <ConnectionButton
            userId={user.user_id}
            status={user.connection_status}
            onConnect={onConnect}
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default UserSearch;
