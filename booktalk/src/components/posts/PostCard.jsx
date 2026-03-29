import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { postsApi } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import BookmarkButton from '@/components/posts/BookmarkButton';

export default function PostCard({ post, currentUserEmail, onUpdate }) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    // Optimistic UI update
    const previousLiked = isLiked;
    setIsLiked(!previousLiked);
    setLikeCount(prev => previousLiked ? prev - 1 : prev + 1);

    try {
      await postsApi.toggleLike(post.id, currentUserEmail, previousLiked);
      onUpdate?.();
    } catch {
      // Revert on failure
      setIsLiked(previousLiked);
      setLikeCount(prev => previousLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    try {
      await postsApi.repost(post.id);
      onUpdate?.();
    } catch (err) {
      console.error('Repost failed:', err);
    }
  };

  const authorName = post.user?.name || post.user?.username || 'Unknown';
  const authorInitial = authorName[0]?.toUpperCase() || '?';
  const authorLink = post.user?.username || post.user?.email || '';

  return (
    <Card className="p-5 flex flex-col hover:shadow-md transition-shadow border-border/60">
      {post.originalPost && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 pb-3 border-b border-border/40">
          <Repeat2 className="w-3.5 h-3.5" />
          <span>{authorName} reposted from {post.originalPost.user?.name || post.originalPost.user?.username}</span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">
            {authorInitial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${authorLink}`} className="font-semibold text-sm hover:underline">
            {authorName}
          </Link>
          <p className="text-xs text-muted-foreground">
            {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a') : ''}
          </p>
        </div>
      </div>

      {/* Quote Block (if exists, or fall back to originalPost quote) */}
      {(post.quote || post.originalPost?.quote || post.book || post.originalPost?.book) && (
        <div className="bg-secondary/60 rounded-xl p-4 mb-4 border-l-4 border-primary/60">
          {(post.quote?.content || post.originalPost?.quote?.content) && (
            <p className="font-heading text-base italic leading-relaxed text-foreground/90 mb-3">
              "{post.quote?.content || post.originalPost?.quote?.content}"
            </p>
          )}
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {post.book?.title || post.originalPost?.book?.title || 'Unknown Book'}
              {(post.book?.author || post.originalPost?.book?.author) && ` — ${post.book?.author || post.originalPost?.book?.author}`}
            </span>
          </div>
        </div>
      )}

      {/* Body */}
      <p className="text-sm flex-1 leading-relaxed text-foreground/85 mb-4 whitespace-pre-wrap">
        {post.content || post.originalPost?.content || ''}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-border/40 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn("gap-2 text-xs", isLiked && "text-red-500")}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-red-500")} />
          {likeCount}
        </Button>
        <Link to={`/post/${post.id}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <MessageCircle className="w-4 h-4" />
            {post.commentCount || 0}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRepost}
          className="gap-2 text-xs"
        >
          <Repeat2 className="w-4 h-4" />
        </Button>
        <BookmarkButton postId={post.id} currentUserEmail={currentUserEmail} />
      </div>
    </Card>
  );
}