import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useParams } from 'react-router-dom';
import { postsApi, booksApi, quotesApi, bookmarksApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Quote, PenSquare, Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FollowButton from '@/components/friends/FollowButton';

export default function Profile() {
  const { user } = useAuth();
  const { email: paramEmail } = useParams();
  const queryClient = useQueryClient();

  const profileEmail = paramEmail ? decodeURIComponent(paramEmail) : user?.email;
  const isOwnProfile = !paramEmail || profileEmail === user?.email;

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['profile-posts', profileEmail],
    queryFn: () => postsApi.filter({ author_email: profileEmail }),
    initialData: [],
    enabled: !!profileEmail,
  });

  const { data: books = [] } = useQuery({
    queryKey: ['profile-books', profileEmail],
    // The backend only allows fetching own books via /api/books/my-books so skip if not own profile
    queryFn: () => booksApi.list(),
    initialData: [],
    enabled: !!profileEmail && isOwnProfile,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['profile-quotes', profileEmail],
    queryFn: () => quotesApi.filter(), // fetches /api/quotes/me
    initialData: [],
    enabled: !!profileEmail && isOwnProfile,
  });

  const { data: bookmarkedPosts = [] } = useQuery({
    queryKey: ['bookmarks-posts', profileEmail],
    queryFn: async () => {
      const bms = await bookmarksApi.filter();
      if (bms.length === 0) return [];
      // bms contains fully hydrated PostDtos now, so we can just return it!
      return bms;
    },
    initialData: [],
    enabled: !!profileEmail && isOwnProfile,
  });

  const displayName = isOwnProfile
    ? (user?.name || user?.username || user?.email || 'You')
    : (posts[0]?.user?.name || posts[0]?.user?.username || profileEmail);

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary">
            {(displayName || '?')[0].toUpperCase()}
          </span>
        </div>
        <h1 className="font-heading text-2xl font-bold">{displayName}</h1>
        {isOwnProfile && (
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        )}
        {!isOwnProfile && user && (
          <div className="flex justify-center mt-3">
            <FollowButton
              targetEmail={profileEmail}
              targetName={posts[0]?.user?.name || posts[0]?.user?.username || profileEmail}
              currentUser={user}
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="font-bold text-lg">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          {isOwnProfile && (
            <>
              <div className="text-center">
                <p className="font-bold text-lg">{books.length}</p>
                <p className="text-xs text-muted-foreground">Books</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{quotes.length}</p>
                <p className="text-xs text-muted-foreground">Quotes</p>
              </div>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="w-full bg-secondary rounded-xl mb-6">
          <TabsTrigger value="posts" className="flex-1 rounded-lg gap-2">
            <PenSquare className="w-4 h-4" /> Posts
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="quotes" className="flex-1 rounded-lg gap-2">
              <Quote className="w-4 h-4" /> Quotes
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger value="bookmarks" className="flex-1 rounded-lg gap-2">
              <Bookmark className="w-4 h-4" /> Saved
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts">
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <PenSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserEmail={user?.email}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['profile-posts', profileEmail] })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="quotes">
            {quotes.length === 0 ? (
              <div className="text-center py-16">
                <Quote className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No quotes saved yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map(q => (
                  <Card key={q.id} className="p-4">
                    <div className="bg-secondary/60 rounded-lg p-3 border-l-4 border-primary/60 mb-2">
                      <p className="font-heading text-sm italic">"{q.content || q.text}"</p>
                    </div>
                    {q.book && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {q.book.title}
                      </p>
                    )}
                    {q.reflection && <p className="text-xs text-foreground/80 mt-2">{q.reflection}</p>}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="bookmarks">
            {bookmarkedPosts.length === 0 ? (
              <div className="text-center py-16">
                <Bookmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No bookmarked posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Hit the bookmark icon on any post to save it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserEmail={user?.email}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['bookmarks-posts', profileEmail] })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}