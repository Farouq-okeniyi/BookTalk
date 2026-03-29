import React, { useState } from 'react';
import { bookmarksApi } from '@/api';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function BookmarkButton({ postId, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', currentUserEmail],
    queryFn: () => bookmarksApi.filter(),
    initialData: [],
    enabled: !!currentUserEmail,
  });

  // Since backend returns the actual PostDto array, we check if the post ID is in the array.
  const isBookmarked = bookmarks.some(b => b.id === postId);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isBookmarked) {
        await bookmarksApi.remove(postId);
      } else {
        await bookmarksApi.create({ postId });
      }
      queryClient.invalidateQueries({ queryKey: ['bookmarks', currentUserEmail] });
    } catch (err) {
      toast.error('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserEmail) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn("gap-2 text-xs ml-auto", isBookmarked && "text-primary")}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
    >
      <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-primary")} />
    </Button>
  );
}