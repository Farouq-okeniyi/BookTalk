import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { postsApi } from '@/api';
import { friendshipsApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Feed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.list(),
    initialData: [],
  });

  const { data: friendships = [] } = useQuery({
    queryKey: ['friendships', user?.email],
    queryFn: () => friendshipsApi.filter(),
    initialData: [],
    enabled: !!user?.email,
  });

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const friendEmails = friendships.map(f => f.email);
  const friendPosts = posts.filter(p => friendEmails.includes(p.user?.email || p.user?.username));

  const PostList = ({ items }) => {
    if (isLoading) return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-5 border border-border rounded-xl space-y-3">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );

    if (items.length === 0) return (
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
      </div>
    );
  };

  return (
    <div>
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