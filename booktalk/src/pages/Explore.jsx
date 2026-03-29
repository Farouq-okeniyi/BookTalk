import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { postsApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Explore() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
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
      <h1 className="font-heading text-3xl font-bold mb-2">Explore</h1>
      <p className="text-sm text-muted-foreground mb-6">Discover what the community is reading</p>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search books, quotes, people..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex h-12 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
        />
      </div>

      {/* Trending Books */}
      {trendingBooks.length > 0 && !search && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Trending Books
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {trendingBooks.map(([title, count]) => (
              <Card
                key={title}
                className="p-4 min-w-[160px] shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSearch(title)}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm line-clamp-2">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{count} {count === 1 ? 'post' : 'posts'}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? `No results for "${search}"` : 'No posts to explore yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
    </div>
  );
}