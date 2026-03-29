import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { booksApi, quotesApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, BookOpen, Plus, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BookDetail() {
  const { id: bookId } = useParams();
  const queryClient = useQueryClient();
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ text: '', reflection: '', impact: '', page_number: '', chapter: '' });

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => booksApi.getById(bookId),
    enabled: !!bookId,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes', bookId],
    queryFn: () => quotesApi.filter({ book_id: bookId }, '-created_date'),
    initialData: [],
    enabled: !!bookId,
  });

  const handleAddQuote = async () => {
    if (!quoteForm.text) {
      toast.error('Quote text is required');
      return;
    }
    await quotesApi.create({
      ...quoteForm,
      page_number: quoteForm.page_number ? Number(quoteForm.page_number) : undefined,
      book_id: bookId,
      book_title: book?.title,
      book_author: book?.author
    });
    setQuoteForm({ text: '', reflection: '', impact: '', page_number: '', chapter: '' });
    setShowAddQuote(false);
    queryClient.invalidateQueries({ queryKey: ['quotes', bookId] });
    toast.success('Quote saved!');
  };

  if (!book) {
    return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <Link to="/books" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to books
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-20 h-28 bg-primary/5 rounded-xl flex items-center justify-center border border-border/50 shrink-0">
          <BookOpen className="w-8 h-8 text-primary/30" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">{book.title}</h1>
          <p className="text-muted-foreground">{book.author}</p>
          {book.notes && <p className="text-sm text-muted-foreground mt-2">{book.notes}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold">Quotes & Reflections</h2>
        <Dialog open={showAddQuote} onOpenChange={setShowAddQuote}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Save a Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>The Quote / Line</Label>
                <Textarea
                  placeholder="Type the quote..."
                  value={quoteForm.text}
                  onChange={e => setQuoteForm(p => ({ ...p, text: e.target.value }))}
                  className="rounded-xl min-h-[80px] font-heading italic"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Page (optional)</Label>
                  <Input
                    type="number"
                    placeholder="Page #"
                    value={quoteForm.page_number}
                    onChange={e => setQuoteForm(p => ({ ...p, page_number: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chapter (optional)</Label>
                  <Input
                    placeholder="Chapter"
                    value={quoteForm.chapter}
                    onChange={e => setQuoteForm(p => ({ ...p, chapter: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What I Learnt</Label>
                <Textarea
                  placeholder="What did this teach you?"
                  value={quoteForm.reflection}
                  onChange={e => setQuoteForm(p => ({ ...p, reflection: e.target.value }))}
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>How I Want It to Impact Me</Label>
                <Textarea
                  placeholder="How do you want this to change you?"
                  value={quoteForm.impact}
                  onChange={e => setQuoteForm(p => ({ ...p, impact: e.target.value }))}
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <Button onClick={handleAddQuote} className="w-full rounded-xl">Save Quote</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16">
          <Quote className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No quotes saved yet. Start highlighting!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map(quote => (
            <Card key={quote.id} className="p-5">
              <div className="bg-secondary/60 rounded-xl p-4 mb-3 border-l-4 border-primary/60">
                <p className="font-heading italic text-foreground/90">"{quote.text}"</p>
                {(quote.page_number || quote.chapter) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {quote.chapter && `Chapter: ${quote.chapter}`}
                    {quote.chapter && quote.page_number && ' · '}
                    {quote.page_number && `Page ${quote.page_number}`}
                  </p>
                )}
              </div>
              {quote.reflection && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">What I Learnt:</p>
                  <p className="text-sm text-foreground/85">{quote.reflection}</p>
                </div>
              )}
              {quote.impact && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Impact I Want:</p>
                  <p className="text-sm text-foreground/85">{quote.impact}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-3">
                {quote.created_date ? format(new Date(quote.created_date), 'MMM d, yyyy') : ''}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}