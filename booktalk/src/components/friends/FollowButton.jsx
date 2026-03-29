import React, { useState } from 'react';
import { friendshipsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, UserPlus, UserCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function FollowButton({ targetEmail, targetName, currentUser }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships', currentUser?.email],
    queryFn: () => friendshipsApi.filter({ requester_email: currentUser.email }),
    initialData: [],
    enabled: !!currentUser?.email,
  });

  const existing = friendships.find(f => f.target_email === targetEmail);

  const handleFollow = async () => {
    if (loading) return;
    setLoading(true);
    if (existing) {
      await friendshipsApi.remove(existing.id);
    } else {
      await friendshipsApi.create({
        requester_email: currentUser.email,
        requester_name: currentUser.full_name || currentUser.fullName || currentUser.email,
        target_email: targetEmail,
        target_name: targetName,
        notifications_enabled: true,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['friendships', currentUser.email] });
    setLoading(false);
  };

  const handleToggleNotifs = async (e) => {
    e.stopPropagation();
    if (!existing || loading) return;
    setLoading(true);
    await friendshipsApi.update(existing.id, {
      notifications_enabled: !existing.notifications_enabled,
    });
    queryClient.invalidateQueries({ queryKey: ['friendships', currentUser.email] });
    setLoading(false);
  };

  if (!currentUser || currentUser.email === targetEmail) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={existing ? 'outline' : 'default'}
        onClick={handleFollow}
        disabled={loading}
        className="rounded-xl gap-2 text-xs"
      >
        {existing ? (
          <><UserCheck className="w-3.5 h-3.5" /> Following</>
        ) : (
          <><UserPlus className="w-3.5 h-3.5" /> Follow</>
        )}
      </Button>
      {existing && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleNotifs}
          disabled={loading}
          title={existing.notifications_enabled ? 'Mute notifications' : 'Enable notifications'}
          className="rounded-xl"
        >
          {existing.notifications_enabled
            ? <Bell className="w-4 h-4 text-primary" />
            : <BellOff className="w-4 h-4 text-muted-foreground" />
          }
        </Button>
      )}
    </div>
  );
}