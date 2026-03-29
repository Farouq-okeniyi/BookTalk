import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { postsApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import PeopleSearch from '@/components/explore/PeopleSearch';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, BookOpen, Users, LayoutGrid } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Explore() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const queryClient = useQueryClient();

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['explore-posts'],
    queryFn: () => postsApi.list({ sort: 'likeCount,desc', size: 50 }),
    initialData: [],
  });

  const filteredPosts = allPosts.filter(p => {
    if (!search) return true;
    return (
      p.book?.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.quote?.content?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const bookCounts = {};
  filteredPosts.forEach(p => {
    const title = p.book?.title || p.originalPost?.book?.title;
    if (title) {
      bookCounts[title] = (bookCounts[title] || 0) + 1;
    }
  });
  const trendingBooks = Object.entries(bookCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-heading text-3xl font-bold">Explore</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover what the community is reading</p>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-6" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <TabsList className="bg-secondary rounded-xl self-start">
            <TabsTrigger value="posts" className="rounded-lg gap-2 px-4 py-2 text-sm">
              <LayoutGrid className="w-4 h-4" />
              Recent Posts
            </TabsTrigger>
            <TabsTrigger value="people" className="rounded-lg gap-2 px-4 py-2 text-sm">
              <Users className="w-4 h-4" />
              Find People
            </TabsTrigger>
          </TabsList>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder={activeTab === 'posts' ? "Search books, quotes, people..." : "Search by username or email..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
            />
          </div>
        </div>

        <TabsContent value="posts">
          {/* Trending Books - Only show in posts tab */}
          {trendingBooks.length > 0 && !search && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Trending Books
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {trendingBooks.map(([title, count]) => (
                  <Card
                    key={title}
                    className="p-4 min-w-[160px] shrink-0 cursor-pointer hover:shadow-md transition-all hover:border-primary/40 group"
                    onClick={() => setSearch(title)}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm line-clamp-2">{title}</p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1">{count} {count === 1 ? 'post' : 'posts'}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 px-6 bg-secondary/20 rounded-2xl border-2 border-dashed border-border/60">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium italic">
                {search ? `We couldn't find any posts matching "${search}"` : 'No posts to explore yet'}
              </p>
              <Button variant="link" className="mt-2 text-primary" onClick={() => setSearch('')}>Clear search</Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-700">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserEmail={user?.email}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['explore-posts'] })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="people" className="animate-in fade-in duration-500">
          <PeopleSearch query={search} currentUserEmail={user?.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}