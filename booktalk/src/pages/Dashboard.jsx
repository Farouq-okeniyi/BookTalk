import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { postsApi, booksApi, quotesApi, friendshipsApi, dashboardApi } from '@/api';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Calendar, Quote, Users, Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { format, isAfter, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import Loader from '@/components/ui/loader';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    enabled: !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['dashboard-posts', user?.email],
    queryFn: () => postsApi.filter({ author_email: user?.email }, '-createdAt', 200),
    initialData: [],
    enabled: !!user?.email,
  });

  const { data: books = [] } = useQuery({
    queryKey: ['dashboard-books'],
    queryFn: () => booksApi.list({ sort: '-created_date', limit: 100 }),
    initialData: [],
    enabled: !!user,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['dashboard-quotes'],
    queryFn: () => quotesApi.filter({ created_by: user?.email }, '-createdAt', 100),
    initialData: [],
    enabled: !!user?.email,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ['dashboard-friends', user?.email],
    queryFn: () => friendshipsApi.filter(),
    initialData: [],
    enabled: !!user?.email,
  });

  if (!stats && (posts.length === 0 || books.length === 0)) {
    return <Loader text="Calculating your reading stats..." />;
  }

  const now = new Date();
  
  const finishedBooks = books.filter(b => b.status === 'finished');
  const readingBooks = books.filter(b => b.status === 'reading');
  const wantToReadBooks = books.filter(b => b.status === 'want_to_read');
  const avgRating = finishedBooks.length && finishedBooks.some(b => b.rating)
    ? (finishedBooks.filter(b => b.rating).reduce((sum, b) => sum + b.rating, 0) / finishedBooks.filter(b => b.rating).length).toFixed(1)
    : '—';

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const dayStr = format(d, 'EEE');
    const count = posts.filter(p => {
      const pDate = p.createdAt || p.created_date;
      return pDate && format(new Date(pDate), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
    }).length;
    return { day: dayStr, posts: count };
  });

  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = subDays(now, (3 - i) * 7 + 6);
    const weekEnd = subDays(now, (3 - i) * 7);
    const count = posts.filter(p => {
      const pDate = p.createdAt || p.created_date;
      if (!pDate) return false;
      const d = new Date(pDate);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { week: `W${i + 1}`, posts: count };
  });

  const sharedBookTitles = [...new Set(posts.map(p => p.book?.title || p.originalPost?.book?.title).filter(Boolean))];

  const statCards = [
    { label: 'Books Finished', value: stats?.totalBooksRead || finishedBooks.length, icon: BookOpen, color: 'text-primary' },
    { label: 'Total Posts', value: stats?.totalPostsMade || posts.length, icon: Calendar, color: 'text-accent' },
    { label: 'Active Streak', value: stats?.activeDaysStreak || 0, icon: TrendingUp, color: 'text-chart-3' },
    { label: 'Quotes Saved', value: stats?.totalQuotesSaved || quotes.length, icon: Quote, color: 'text-chart-4' },
    
    { label: 'Currently Reading', value: readingBooks.length, icon: BookOpen, color: 'text-primary' },
    { label: 'Likes Received', value: stats?.totalLikesReceived || 0, icon: ThumbsUp, color: 'text-accent' },
    { label: 'Friends Following', value: friends.length, icon: Users, color: 'text-chart-2' },
    { label: 'Avg Book Rating', value: avgRating, icon: Star, color: 'text-chart-1' },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">Your reading journey at a glance</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="font-heading text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="week">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold">Post Activity</h2>
          <TabsList className="bg-secondary rounded-xl">
            <TabsTrigger value="week" className="rounded-lg text-xs">7 Days</TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg text-xs">4 Weeks</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="week">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last4Weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="posts" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div>
          <h2 className="font-heading text-lg font-semibold mb-4">Reading Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Finished', count: finishedBooks.length, color: 'bg-accent' },
              { label: 'Reading Now', count: readingBooks.length, color: 'bg-primary' },
              { label: 'Want to Read', count: wantToReadBooks.length, color: 'bg-chart-3' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <p className="text-sm flex-1">{label}</p>
                <p className="font-semibold text-sm">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold mb-4">Books You've Posted About</h2>
          {sharedBookTitles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet</p>
          ) : (
            <div className="space-y-2">
              {sharedBookTitles.slice(0, 5).map(title => {
                const count = posts.filter(p => (p.book?.title || p.originalPost?.book?.title) === title).length;
                return (
                  <div key={title} className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm flex-1 line-clamp-1">{title}</p>
                    <span className="text-xs text-muted-foreground">{count} posts</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Card className="mt-8 p-5 bg-secondary/50 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Keep it up!</p>
            <p className="text-xs text-muted-foreground">
              You've shared thoughts on {sharedBookTitles.length} book{sharedBookTitles.length !== 1 ? 's' : ''} with {stats?.totalPostsMade || posts.length} total post{stats?.totalPostsMade !== 1 ? 's' : ''}.
            </p>
          </div>
          <Link to="/new-post" className="ml-auto">
            <span className="text-xs font-medium text-primary hover:underline">Share more →</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}