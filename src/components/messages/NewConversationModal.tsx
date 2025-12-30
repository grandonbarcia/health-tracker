'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types/profile';
import { getInitials } from '@/lib/messageUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Search, MessageSquare } from 'lucide-react';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

interface Connection {
  id: string;
  profile: Partial<UserProfile>;
}

export function NewConversationModal({
  open,
  onClose,
  onSelectUser,
}: NewConversationModalProps) {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      loadConnections();
    }
  }, [open]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/connections?status=accepted', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load connections');

      const data = await response.json();
      const enrichedConnections: Connection[] = (data.connections || [])
        .filter((c: any) => c.profile)
        .map((c: any) => ({
          id:
            c.follower_id === session.user.id ? c.following_id : c.follower_id,
          profile: c.profile,
        }));

      setConnections(enrichedConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter((c) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      c.profile.display_name?.toLowerCase().includes(searchLower) ||
      c.profile.username?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Connections list */}
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {search
                  ? 'No connections found'
                  : 'No connections yet. Connect with others to start messaging!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConnections.map((connection) => (
                <button
                  key={connection.id}
                  onClick={() => handleSelect(connection.id)}
                  className="w-full p-3 flex items-center gap-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  {connection.profile.avatar_url ? (
                    <img
                      src={connection.profile.avatar_url}
                      alt={connection.profile.display_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {getInitials(
                        connection.profile.display_name ||
                          connection.profile.username ||
                          ''
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {connection.profile.display_name ||
                        connection.profile.username}
                    </p>
                    {connection.profile.display_name &&
                      connection.profile.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{connection.profile.username}
                        </p>
                      )}
                  </div>

                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
