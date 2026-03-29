import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { postsApi, commentsApi } from '@/api';
import PostCard from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function PostDetail() {
  const { id: postId } = useParams();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsApi.getById(postId),
    enabled: !!postId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentsApi.filter({ post_id: postId }),
    initialData: [],
    enabled: !!postId,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      await commentsApi.create({
        post_id: postId,
        content: commentText,
      });
      // The backend will automatically update the comments count.
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }
  });

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </Link>

      <PostCard
        post={post}
        currentUserEmail={user?.email}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['post', postId] })}
      />

      {/* Comment Input */}
      <div className="mt-6 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <span className="text-xs font-semibold text-primary">
            {(user?.name || user?.username || '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Share your thoughts on this..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            className="rounded-xl min-h-[80px]"
          />
          <Button
            onClick={() => addComment.mutate()}
            disabled={!commentText.trim() || addComment.isPending}
            size="sm"
            className="rounded-xl gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="mt-8 space-y-4">
        <h3 className="font-heading text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        {comments.map(comment => {
          const authorName = comment.author?.name || comment.author?.username || 'Unknown';
          const dateStr = comment.createdAt || comment.created_date;
          return (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    {(authorName)[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {dateStr ? format(new Date(dateStr), 'MMM d, h:mm a') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/85 mt-1 whitespace-pre-wrap">{comment.content || comment.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Start the conversation!</p>
        )}
      </div>
    </div>
  );
}