import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { postsApi, booksApi, quotesApi, bookmarksApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Quote, PenSquare, Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FollowButton from '@/components/friends/FollowButton';
import Loader from '@/components/ui/loader';

export default function Profile() {
  const { user } = useAuth();
  const { email: paramEmail } = useParams();
  const queryClient = useQueryClient();

  const profileEmail = paramEmail ? decodeURIComponent(paramEmail) : user?.email;
  const isOwnProfile = !paramEmail || 
                      profileEmail === user?.email || 
                      profileEmail === user?.username;

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['profile-quotes', profileEmail],
    queryFn: () => quotesApi.filter(), // fetches /api/quotes/me
    initialData: [],
    enabled: !!profileEmail && isOwnProfile,
  });

  const posts = quotes; // Use quotes as posts in this migration
  const postsLoading = quotesLoading;

  const { data: books = [] } = useQuery({
    queryKey: ['profile-books', profileEmail],
    // The backend only allows fetching own books via /api/books/my-books so skip if not own profile
    queryFn: () => booksApi.list(),
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
    <div className="space-y-8 pb-10">
      {/* Premium Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/30" />
        <div className="relative pt-12 pb-8 px-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-background/80 backdrop-blur-md border-2 border-primary/20 flex items-center justify-center mb-4 shadow-xl ring-8 ring-card/40">
            <span className="text-3xl font-bold text-primary">
              {(displayName || '?')[0].toUpperCase()}
            </span>
          </div>
          
          <div className="mb-2">
            <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">{displayName}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              {isOwnProfile ? (
                 <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{user?.email}</span>
              ) : (
                 <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Top Reader</span>
              )}
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="flex justify-center mt-4">
              <FollowButton
                targetEmail={profileEmail}
                targetName={posts[0]?.user?.name || posts[0]?.user?.username || profileEmail}
                currentUser={user}
              />
            </div>
          )}

          <div className="flex items-center justify-center gap-8 mt-8 w-full max-w-md mx-auto py-4 rounded-2xl bg-secondary/30 backdrop-blur-sm border border-white/5">
            <div className="text-center group cursor-default">
              <p className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{posts.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Posts</p>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="text-center group cursor-default">
              <p className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{books.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Books</p>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="text-center group cursor-default">
              <p className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{quotes.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quotes</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full bg-secondary/50 p-1 rounded-2xl mb-8 border border-border/40 backdrop-blur-md h-14">
          <TabsTrigger value="posts" className="flex-1 rounded-xl gap-2 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <PenSquare className="w-4 h-4" /> Posts
          </TabsTrigger>
          {isOwnProfile && (
            <>
              <TabsTrigger value="quotes" className="flex-1 rounded-xl gap-2 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Quote className="w-4 h-4" /> Quotes
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex-1 rounded-xl gap-2 font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Bookmark className="w-4 h-4" /> Saved
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="posts" className="mt-0 focus-visible:outline-none">
          {postsLoading ? (
            <div className="grid gap-4">
               {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/60">
              <PenSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground/80">No memories shared</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Start sharing thoughts from your favorite books to see them here.</p>
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
          <TabsContent value="quotes" className="mt-0 focus-visible:outline-none">
            {quotes.length === 0 ? (
              <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/60">
                <Quote className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground/80">Your quote collection</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Save wise words while reading to keep them close.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1">
                {quotes.map(q => (
                  <Card key={q.id} className="p-6 bg-card/50 backdrop-blur-sm border-border/60 rounded-2xl hover:shadow-md transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Quote className="w-16 h-16" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="mb-4">
                        <p className="font-heading text-lg italic leading-relaxed text-foreground/90 relative inline">
                          <span className="text-primary/30 text-3xl font-serif absolute -left-4 -top-2">"</span>
                          {q.content || q.text}
                          <span className="text-primary/30 text-3xl font-serif absolute -right-2">"</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/20">
                        {q.book && (
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-10 bg-primary/10 rounded flex items-center justify-center overflow-hidden border border-primary/10">
                                {q.book.coverUrl ? (
                                  <img src={q.book.coverUrl} alt={q.book.title} className="w-full h-full object-cover" />
                                ) : (
                                  <BookOpen className="w-4 h-4 text-primary/40" />
                                )}
                             </div>
                             <div>
                                <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{q.book.title}</p>
                                <p className="text-[10px] text-muted-foreground">{q.book.author}</p>
                             </div>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">Saved {q.createdAt ? format(new Date(q.createdAt), 'MMM d') : ''}</span>
                      </div>

                      {q.reflection && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <p className="text-xs text-foreground/80 leading-relaxed italic flex gap-2 italic">
                            <span className="font-bold text-primary not-italic">Thought:</span> 
                            {q.reflection}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="bookmarks" className="mt-0 focus-visible:outline-none">
            {bookmarkedPosts.length === 0 ? (
              <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/60">
                <Bookmark className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground/80">Safe keeping</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Posts you bookmark will appear here for easy access later.</p>
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