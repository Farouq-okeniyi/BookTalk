import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { postsApi } from '@/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import BookmarkButton from '@/components/posts/BookmarkButton';
import { toast } from 'sonner';

export default function PostCard({ post, currentUserEmail, onUpdate }) {
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);

  // We assume repostedByMe might be present in future, or we track it locally
  const [isReposted, setIsReposted] = useState(post.repostedByMe || false);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [repostAnimating, setRepostAnimating] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);

    const previousLiked = isLiked;
    const newLiked = !previousLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => previousLiked ? prev - 1 : prev + 1);

    if (newLiked) {
      toast.success('Post Liked!', {
        icon: <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pop" />,
        duration: 2000,
      });
    }

    try {
      await postsApi.toggleLike(post.id, currentUserEmail, previousLiked);
      onUpdate?.();
    } catch {
      setIsLiked(previousLiked);
      setLikeCount(prev => previousLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    setRepostAnimating(true);
    setTimeout(() => setRepostAnimating(false), 300);

    const previousReposted = isReposted;
    const newReposted = !previousReposted;
    
    setIsReposted(newReposted);
    setRepostCount(prev => previousReposted ? prev - 1 : prev + 1);

    if (newReposted) {
      toast.success('Post Reposted!', {
        icon: <Repeat2 className="w-4 h-4 text-green-500 animate-pop" />,
        duration: 2000,
      });
    }

    try {
      if (previousReposted) {
        await postsApi.removeRepost(post.id);
      } else {
        await postsApi.repost(post.id);
      }
      onUpdate?.();
    } catch (err) {
      setIsReposted(previousReposted);
      setRepostCount(prev => previousReposted ? prev + 1 : prev - 1);
    } finally {
      setIsReposting(false);
    }
  };

  const authorName = post.user?.name || post.user?.username || 'Unknown';
  const authorInitial = authorName[0]?.toUpperCase() || '?';
  const authorLink = post.user?.username || post.user?.email || '';

  const isRepost = !!post.originalPost;
  const originalPost = post.originalPost;

  // Data mapping for new "Reader's Thought" format
  // If postContent is present, it's the commentary, and content is the quote text
  const displayCommentary = post.postContent || post.content;
  const displayQuoteContent = post.quote?.content || (post.postContent ? post.content : null);
  const displayBook = post.book || post.quote?.book;

  return (
    <Card className="p-5 flex flex-col hover:shadow-md transition-shadow border-border/60 overflow-hidden group bg-card/50 backdrop-blur-sm">
      {isRepost && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 pb-3 border-b border-border/40">
          <Repeat2 className="w-3.5 h-3.5" />
          <span>{authorName} reposted</span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <span className="text-sm font-semibold text-primary">
            {authorInitial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${authorLink}`} className="font-semibold text-sm hover:underline truncate">
              {authorName}
            </Link>
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-secondary/50">Reader</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {post.createdAt ? format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a') : ''}
          </p>
        </div>
      </div>

      {/* Main Commentary */}
      {displayCommentary && (
        <p className="text-sm leading-relaxed text-foreground/90 mb-4 whitespace-pre-wrap font-medium">
          {displayCommentary}
        </p>
      )}

      {/* Main Content Area (Original Post or Quote-Repost) */}
      {isRepost ? (
        <div className="border border-border/60 rounded-2xl p-4 bg-secondary/30 hover:bg-secondary/40 transition-colors">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">
                  {(originalPost.user?.name || originalPost.user?.username || '?')[0].toUpperCase()}
                </span>
             </div>
             <span className="text-xs font-semibold">
               {originalPost.user?.name || originalPost.user?.username || 'Unknown'}
             </span>
             <span className="text-[10px] text-muted-foreground">
               {originalPost.createdAt ? format(new Date(originalPost.createdAt), 'MMM d') : ''}
             </span>
          </div>

          {(originalPost.quote || originalPost.book) && (
            <div className="bg-background/60 rounded-xl p-3 mb-3 border-l-2 border-primary/40">
              {originalPost.quote?.content && (
                <p className="font-heading text-sm italic leading-relaxed text-foreground/80 mb-2">
                  "{originalPost.quote.content}"
                </p>
              )}
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {originalPost.book?.title || 'Unknown Book'}
                  {originalPost.book?.author && ` — ${originalPost.book.author}`}
                </span>
              </div>
            </div>
          )}
          
          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {originalPost.content}
          </p>
        </div>
      ) : (
        /* Regular Non-Repost Content (Quotes/Books attached directly) */
        <>
          {(displayQuoteContent || displayBook) && (
            <div className="bg-secondary/40 rounded-2xl p-4 mb-4 border border-border/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <BookOpen className="w-12 h-12" />
              </div>
              
              {displayQuoteContent && (
                <div className="relative z-10">
                  <p className="font-heading text-base italic leading-relaxed text-foreground/90 mb-4 relative">
                    <span className="text-3xl text-primary/30 absolute -top-4 -left-2 font-serif">"</span>
                    {displayQuoteContent}
                    <span className="text-3xl text-primary/30 absolute -bottom-8 -right-1 font-serif">"</span>
                  </p>
                </div>
              )}
              
              {displayBook && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                  <div className="w-8 h-10 bg-primary/10 rounded flex items-center justify-center overflow-hidden border border-primary/10">
                    {displayBook.coverUrl ? (
                      <img src={displayBook.coverUrl} alt={displayBook.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-primary/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {displayBook.title || 'Unknown Book'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {displayBook.author || 'Unknown Author'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-border/40 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "gap-2 text-xs transition-colors duration-300", 
            isLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn(
            "w-4 h-4 transition-all duration-300", 
            isLiked && "fill-red-500",
            likeAnimating && "animate-pop"
          )} />
          <span>{likeCount}</span>
        </Button>

        <Link to={`/post/${post.id}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentCount || 0}</span>
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRepost}
          className={cn(
            "gap-2 text-xs transition-colors duration-300",
            isReposted ? "text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Repeat2 className={cn(
            "w-4 h-4 transition-all duration-300",
            isReposted && "text-green-500",
            repostAnimating && "animate-pop"
          )} />
          <span>{repostCount}</span>
        </Button>

        <BookmarkButton postId={post.id} currentUserEmail={currentUserEmail} />
      </div>
    </Card>
  );
}