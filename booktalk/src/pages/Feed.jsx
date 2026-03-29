import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { postsApi, friendshipsApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import { BookOpen, Users, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';

export default function Feed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const loadMoreRef = useRef(null);
  const PULL_THRESHOLD = 80;

  // --- Infinite Query for Posts ---
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['posts-infinite'],
    queryFn: ({ pageParam = 0 }) => postsApi.list({ page: pageParam, size: 20, sort: 'createdAt,desc' }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.page) return undefined;
      const { number, totalPages } = lastPage.page;
      return number + 1 < totalPages ? number + 1 : undefined;
    },
    initialPageParam: 0,
    enabled: !!user,
  });

  const posts = data?.pages.flatMap(page => page.content) || [];

  // --- Friendships for Filtering ---
  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships', user?.email],
    queryFn: () => friendshipsApi.filter(),
    initialData: [],
    enabled: !!user?.email,
  });

  const friendEmails = friendships.map(f => f.email);
  const friendPosts = posts.filter(p => friendEmails.includes(p.user?.email || p.user?.username));

  // --- Infinite Scroll Observer ---
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // --- Pull-to-Refresh Logic ---
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      const distance = Math.min(diff * 0.5, PULL_THRESHOLD + 20);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['posts-infinite'] });
  };

  const PostList = ({ items }) => {
    if (isLoading && !isRefreshing) return <Loader text="Fetching your feed..." />;

    if (items.length === 0 && !isLoading) return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-xl font-semibold mb-2">No posts yet</h2>
        <p className="text-muted-foreground text-sm mb-6">Be the first to share what you're reading</p>
        <Link to="/new-post">
          <Button className="rounded-xl">Create your first post</Button>
        </Link>
      </div>
    );

    return (
      <div className="space-y-4">
        {items.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserEmail={user?.email}
            onUpdate={handleUpdate}
          />
        ))}

        {/* Infinite Scroll Sentinel */}
        <div ref={loadMoreRef} className="py-8 text-center min-h-[100px] flex flex-col items-center justify-center">
          {isFetchingNextPage ? (
            <Loader variant="mini" text="Loading more posts..." />
          ) : hasNextPage ? (
            <p className="text-xs text-muted-foreground italic">Scroll for more</p>
          ) : posts.length > 0 ? (
            <p className="text-xs text-muted-foreground italic">You've reached the end!</p>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative transition-transform duration-200"
      style={{ transform: `translateY(${pullDistance}px)` }}
    >
      {/* Pull-To-Refresh Indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center gap-2 pointer-events-none transition-opacity",
          pullDistance > 20 ? "opacity-100" : "opacity-0",
          isRefreshing ? "top-4" : "-top-10"
        )}
      >
        <RefreshCw className={cn("w-5 h-5 text-primary", (isRefreshing || pullDistance >= PULL_THRESHOLD) && "animate-spin")} />
        <span className="text-xs font-medium text-muted-foreground">
          {isRefreshing ? "Refreshing..." : pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Your Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">See what the community is reading</p>
        </div>
        <Link to="/new-post">
          <Button className="bg-primary hover:bg-primary/90 rounded-xl">
            Share a thought
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full bg-secondary rounded-xl mb-6">
          <TabsTrigger value="all" className="flex-1 rounded-lg gap-2">
            <BookOpen className="w-4 h-4" /> All Posts
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 rounded-lg gap-2">
            <Users className="w-4 h-4" />
            Friends
            {friendPosts.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 ml-1 leading-none">
                {friendPosts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PostList items={posts} />
        </TabsContent>

        <TabsContent value="friends">
          {friendEmails.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-2">Follow some readers</h2>
              <p className="text-muted-foreground text-sm mb-6">Visit someone's profile and hit Follow to see their posts here</p>
              <Link to="/explore">
                <Button variant="outline" className="rounded-xl">Explore posts</Button>
              </Link>
            </div>
          ) : (
            <PostList items={friendPosts} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}