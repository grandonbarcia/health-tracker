'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  MessageSquare,
} from 'lucide-react';

interface ConnectionButtonProps {
  userId: string;
  status:
    | 'none'
    | 'pending_sent'
    | 'pending_received'
    | 'accepted'
    | 'blocked'
    | 'self';
  onConnect: (userId: string) => Promise<void>;
  onAccept?: (userId: string) => Promise<void>;
  onReject?: (userId: string) => Promise<void>;
  onRemove?: (userId: string) => Promise<void>;
  size?: 'sm' | 'default' | 'lg';
}

export function ConnectionButton({
  userId,
  status,
  onConnect,
  onAccept,
  onReject,
  onRemove,
  size = 'default',
}: ConnectionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleAction = async (
    action: () => Promise<void>,
    newStatus?: string
  ) => {
    setLoading(true);
    try {
      await action();
      if (newStatus) {
        setCurrentStatus(newStatus as any);
      }
    } catch (error) {
      console.error('Connection action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === 'self') {
    return null;
  }

  if (currentStatus === 'blocked') {
    return (
      <Button variant="ghost" size={size} disabled>
        <UserX className="w-4 h-4 mr-2" />
        Blocked
      </Button>
    );
  }

  if (currentStatus === 'accepted') {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size={size} disabled>
          <UserCheck className="w-4 h-4 mr-2" />
          Connected
        </Button>
        <Button
          variant="secondary"
          size={size}
          onClick={() => router.push(`/messages?start=${userId}`)}
          title="Send message"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => handleAction(() => onRemove(userId), 'none')}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserX className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  if (currentStatus === 'pending_sent') {
    return (
      <Button variant="outline" size={size} disabled>
        <Clock className="w-4 h-4 mr-2" />
        Pending
      </Button>
    );
  }

  if (currentStatus === 'pending_received') {
    return (
      <div className="flex gap-2">
        {onAccept && (
          <Button
            size={size}
            onClick={() => handleAction(() => onAccept(userId), 'accepted')}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            Accept
          </Button>
        )}
        {onReject && (
          <Button
            variant="outline"
            size={size}
            onClick={() => handleAction(() => onReject(userId), 'none')}
            disabled={loading}
          >
            <UserX className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // status === 'none'
  return (
    <Button
      size={size}
      onClick={() => handleAction(() => onConnect(userId), 'pending_sent')}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      Connect
    </Button>
  );
}

export default ConnectionButton;
