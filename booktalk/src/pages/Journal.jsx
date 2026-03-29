import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { journalApi, friendshipsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Lock, Users, Globe, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Loader from '@/components/ui/loader';

const MOODS = [
  { value: 'inspired', emoji: '✨', label: 'Inspired' },
  { value: 'reflective', emoji: '🪞', label: 'Reflective' },
  { value: 'curious', emoji: '🔍', label: 'Curious' },
  { value: 'grateful', emoji: '🌿', label: 'Grateful' },
  { value: 'melancholic', emoji: '🌧️', label: 'Melancholic' },
  { value: 'excited', emoji: '🔥', label: 'Excited' },
  { value: 'calm', emoji: '🌊', label: 'Calm' },
];

const VISIBILITY_CONFIG = {
  PRIVATE: { icon: Lock, label: 'Only me', color: 'bg-muted text-muted-foreground' },
  FRIENDS: { icon: Users, label: 'Friends', color: 'bg-secondary text-secondary-foreground' },
  PUBLIC: { icon: Globe, label: 'Everyone', color: 'bg-primary/10 text-primary' },
};

const emptyForm = { title: '', content: '', visibility: 'PRIVATE', mood: '' };

export default function Journal() {
  const { user } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', user?.email],
    queryFn: () => journalApi.filter(),
    initialData: [],
    enabled: !!user?.email,
  });

  const { data: friendEntries = [] } = useQuery({
    queryKey: ['journal-friends', user?.email],
    queryFn: () => journalApi.filter({ visibility: 'friends' }),
    initialData: [],
    enabled: !!user?.email,
  });

  const openNew = () => {
    setEditingEntry(null);
    setForm(emptyForm);
    setShowEditor(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setForm({
      title: entry.title || '',
      content: entry.content || '',
      visibility: entry.visibility || 'PRIVATE',
      mood: entry.mood || '',
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error('Write something first!'); return; }
    setSaving(true);
    const data = {
      ...form,
    };
    if (editingEntry) {
      await journalApi.update(editingEntry.id, data);
      toast.success('Entry updated');
    } else {
      await journalApi.create(data);
      toast.success('Entry saved');
    }
    queryClient.invalidateQueries({ queryKey: ['journal', user.email] });
    setShowEditor(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await journalApi.remove(id);
    queryClient.invalidateQueries({ queryKey: ['journal', user.email] });
    toast.success('Entry deleted');
  };

  const myEntries = filter === 'all' ? entries
    : filter === 'friends-feed' ? friendEntries
    : entries.filter(e => e.visibility === filter.toUpperCase());

  const moodMap = Object.fromEntries(MOODS.map(m => [m.value, m]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">My Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Your private reading diary</p>
        </div>
        <Button onClick={openNew} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> New Entry
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { key: 'all', label: 'All mine' },
          { key: 'private', label: '🔒 Private' },
          { key: 'friends', label: '👥 Friends' },
          { key: 'public', label: '🌍 Public' },
          { key: 'friends-feed', label: "✨ Friends' entries" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {isLoading ? (
        <Loader text="Opening your journal..." />
      ) : myEntries.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl font-semibold mb-2">Nothing here yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Start writing your first journal entry</p>
          <Button onClick={openNew} className="rounded-xl">Write something</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {myEntries.map(entry => {
            const vis = VISIBILITY_CONFIG[entry.visibility] || VISIBILITY_CONFIG.PRIVATE;
            const VisIcon = vis.icon;
            const mood = moodMap[entry.mood];
            const isOwn = entry.author?.email === user?.email || entry.author?.username === user?.username || true;
            const authorName = entry.author?.name || entry.author?.username || 'Unknown';
            const dateStr = entry.createdAt || entry.created_date;

            return (
              <Card key={entry.id} className="p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {mood && <span className="text-base">{mood.emoji}</span>}
                      <h3 className="font-heading font-semibold text-base">
                        {entry.title || (dateStr ? format(new Date(dateStr), 'MMMM d, yyyy') : 'Journal Entry')}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${vis.color}`}>
                        <VisIcon className="w-3 h-3" /> {vis.label}
                      </span>
                      {mood && <span className="text-xs text-muted-foreground">{mood.label}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {!isOwn && `${authorName} · `}
                      {dateStr ? format(new Date(dateStr), 'MMM d, yyyy · h:mm a') : ''}
                    </p>
                  </div>
                  {isOwn && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {entry.book?.title && (
                  <div className="bg-secondary/60 rounded-xl p-3 border-l-4 border-primary/50 mb-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {entry.book?.title}
                      {entry.book?.author && ` — ${entry.book?.author}`}
                    </p>
                  </div>
                )}

                <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap line-clamp-6">
                  {entry.content || entry.body}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Input
                placeholder="Title (optional)"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="rounded-xl text-base font-heading"
              />
            </div>

            {/* Mood picker */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">How are you feeling?</Label>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setForm(p => ({ ...p, mood: p.mood === m.value ? '' : m.value }))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      form.mood === m.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-muted'
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main body */}
            <div>
              <Textarea
                placeholder="Write freely... this is your space 🌿"
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                className="rounded-xl min-h-[200px] text-sm leading-relaxed"
                autoFocus
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-3">
                <Label className="text-sm">Who can see this?</Label>
                <Select value={form.visibility} onValueChange={v => setForm(p => ({ ...p, visibility: v }))}>
                  <SelectTrigger className="w-36 rounded-xl h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">🔒 Only me</SelectItem>
                    <SelectItem value="FRIENDS">👥 My friends</SelectItem>
                    <SelectItem value="PUBLIC">🌍 Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowEditor(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="rounded-xl" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editingEntry ? 'Update' : 'Save Entry'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}