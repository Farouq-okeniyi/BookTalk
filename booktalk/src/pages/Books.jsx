import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Check, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import BookCard from '@/components/books/BookCard';
import Loader from '@/components/ui/loader';

export default function Books() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', status: 'reading', notes: '' });
  const queryClient = useQueryClient();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => booksApi.list({ sort: '-created_date' }),
    initialData: [],
  });

  const handleAdd = async () => {
    if (!form.title || !form.author) {
      toast.error('Title and author are required');
      return;
    }
    await booksApi.create({
      ...form,
      start_date: form.status === 'reading' ? new Date().toISOString().split('T')[0] : undefined
    });
    setForm({ title: '', author: '', status: 'reading', notes: '' });
    setShowAdd(false);
    queryClient.invalidateQueries({ queryKey: ['books'] });
    toast.success('Book added!');
  };

  const reading = books.filter(b => b.status === 'reading');
  const finished = books.filter(b => b.status === 'finished');
  const wantToRead = books.filter(b => b.status === 'want_to_read');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">My Books</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your reading journey</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Add a Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Book title"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  placeholder="Author name"
                  value={form.author}
                  onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Currently Reading</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="want_to_read">Want to Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Why do you want to read this?"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl">Add Book</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="reading">
        <TabsList className="mb-6 bg-secondary rounded-xl">
          <TabsTrigger value="reading" className="rounded-lg gap-2">
            <BookOpen className="w-4 h-4" /> Reading ({reading.length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="rounded-lg gap-2">
            <Check className="w-4 h-4" /> Finished ({finished.length})
          </TabsTrigger>
          <TabsTrigger value="want_to_read" className="rounded-lg gap-2">
            <BookMarked className="w-4 h-4" /> Want to Read ({wantToRead.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reading">
          <BookList books={reading} queryClient={queryClient} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="finished">
          <BookList books={finished} queryClient={queryClient} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="want_to_read">
          <BookList books={wantToRead} queryClient={queryClient} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookList({ books, queryClient, isLoading }) {
  if (isLoading) return <Loader text="Loading your library..." />;
  
  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No books here yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {books.map(book => (
        <BookCard key={book.id} book={book} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['books'] })} />
      ))}
    </div>
  );
}