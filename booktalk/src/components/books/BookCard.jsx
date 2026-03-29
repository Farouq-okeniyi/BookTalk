import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, Trash2 } from 'lucide-react';
import { booksApi } from '@/api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusLabels = {
  reading: 'Reading',
  finished: 'Finished',
  want_to_read: 'Want to Read'
};

const statusColors = {
  reading: 'bg-primary/10 text-primary border-primary/20',
  finished: 'bg-accent/10 text-accent border-accent/20',
  want_to_read: 'bg-secondary text-secondary-foreground border-border'
};

export default function BookCard({ book, onUpdate }) {
  const handleDelete = async () => {
    await booksApi.remove(book.id);
    toast.success('Book removed');
    onUpdate?.();
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-14 h-20 bg-primary/5 rounded-lg flex items-center justify-center shrink-0 border border-border/50">
          <BookOpen className="w-6 h-6 text-primary/40" />
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/book/${book.id}`} className="font-semibold text-sm hover:underline line-clamp-1">
            {book.title}
          </Link>
          <p className="text-xs text-muted-foreground">{book.author}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className={`text-[10px] ${statusColors[book.status]}`}>
              {statusLabels[book.status]}
            </Badge>
            {book.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs">{book.rating}</span>
              </div>
            )}
          </div>
          {book.start_date && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Started {format(new Date(book.start_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="shrink-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {book.notes && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40 line-clamp-2">
          {book.notes}
        </p>
      )}
    </Card>
  );
}