import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { postsApi, booksApi, quotesApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { BookOpen, Quote, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function NewPost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    quote_text: '',
    book_title: '',
    book_author: '',
    body: '',
    selectedBookId: ''
  });

  const { data: books = [] } = useQuery({
    queryKey: ['my-books'],
    queryFn: () => booksApi.list({ sort: '-created_date' }),
    initialData: [],
  });

  const handleBookSelect = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setForm(prev => ({
        ...prev,
        selectedBookId: bookId,
        book_title: book.title,
        book_author: book.author
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.quote_text || (!form.selectedBookId && !form.book_title) || !form.body) {
      toast.error('Please fill in the quote, book title, and your thoughts');
      return;
    }
    setIsSubmitting(true);
    try {
      let finalBookId = form.selectedBookId;
      if (!finalBookId) {
        const newBook = await booksApi.create({ 
          title: form.book_title, 
          author: form.book_author || 'Unknown' 
        });
        finalBookId = newBook.id;
      }

      const newQuote = await quotesApi.create({
        bookId: finalBookId,
        content: form.quote_text
      });

      await postsApi.create({
        content: form.body,
        quoteId: newQuote.id,
        bookId: finalBookId,
        visibility: 'PUBLIC'
      });

      toast.success('Post shared!');
      navigate('/');
    } catch (e) {
      // Global errorHandler handles the toast
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">Share a Thought</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Tag a line from a book and share what it means to you
      </p>

      <Card className="p-6 space-y-6">
        {/* Book Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Select a Book (or type manually)
          </Label>
          {books.length > 0 && (
            <Select onValueChange={handleBookSelect}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Choose from your library..." />
              </SelectTrigger>
              <SelectContent>
                {books.map(book => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} — {book.author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Input
              placeholder="Book title"
              value={form.book_title}
              onChange={e => setForm(prev => ({ ...prev, book_title: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              placeholder="Author"
              value={form.book_author}
              onChange={e => setForm(prev => ({ ...prev, book_author: e.target.value }))}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Quote */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Quote className="w-4 h-4" /> The Line / Quote
          </Label>
          <Textarea
            placeholder="Type the line or paragraph that caught your attention..."
            value={form.quote_text}
            onChange={e => setForm(prev => ({ ...prev, quote_text: e.target.value }))}
            className="rounded-xl min-h-[100px] font-heading italic"
          />
        </div>

        {/* Thoughts */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Your Thoughts</Label>
          <Textarea
            placeholder="What do you think about this line? How do you want to use it? Share your opinion..."
            value={form.body}
            onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
            className="rounded-xl min-h-[150px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary hover:bg-primary/90 h-12 text-base gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Posting...' : 'Post to Feed'}
        </Button>
      </Card>
    </div>
  );
}