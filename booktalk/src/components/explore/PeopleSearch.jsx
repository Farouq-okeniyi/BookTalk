import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi, friendshipsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserCheck, Loader2, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

export default function PeopleSearch({ query, currentUserEmail }) {
  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => usersApi.search(query),
    enabled: query.length >= 2,
    placeholderData: [],
  });

  const handleAddFriend = async (username) => {
    try {
      await friendshipsApi.create({ targetUsername: username });
      toast.success(`Friend request sent to ${username}!`);
    } catch (e) {
      // Global errorHandler handles the toast
    }
  };

  if (query.length < 2) {
    return (
      <div className="text-center py-16 opacity-60">
        <User className="w-10 h-10 mx-auto mb-3" />
        <p className="text-sm">Type at least 2 characters to search for people...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16 opacity-60">
        <Mail className="w-10 h-10 mx-auto mb-3" />
        <p className="text-sm">No users found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((profile) => {
        // Don't show current user in results
        if (profile.email === currentUserEmail) return null;

        return (
          <Card key={profile.username} className="p-4 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-primary/10">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                  {profile.name?.charAt(0) || profile.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-1">{profile.name || profile.username}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">@{profile.username}</p>
                {profile.bio && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">"{profile.bio}"</p>}
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-xl gap-2 hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
              onClick={() => handleAddFriend(profile.username)}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
