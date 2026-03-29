import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Clock, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Reminders() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'DAILY', dayOfWeek: '1', hour: '20', minute: '00' });
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: remindersApi.list,
    initialData: [],
  });

  const handleCreate = async () => {
    await remindersApi.create({
      type: form.type,
      dayOfWeek: parseInt(form.dayOfWeek),
      scheduleTime: { hour: parseInt(form.hour), minute: parseInt(form.minute), second: 0, nano: 0 }
    });
    setForm({ type: 'DAILY', dayOfWeek: '1', hour: '20', minute: '00' });
    setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    toast.success('Reminder set!');
  };

  const handleDelete = async (id) => {
    await remindersApi.remove(id);
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    toast.success('Reminder deleted');
  };

  // Format time util
  const formatTime = (time) => {
    if (!time) return '8:00 PM';
    let h = 0, m = 0;

    if (typeof time === 'string') {
      const portions = time.split(':');
      h = parseInt(portions[0] || '0');
      m = parseInt(portions[1] || '0');
    } else {
      h = time.hour || 0;
      m = time.minute || 0;
    }

    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const formattedM = String(m).padStart(2, '0');
    return `${hour12}:${formattedM} ${ampm}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Reading Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">Build your daily reading habit</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Set Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Set Reading Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === 'WEEKLY' && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={form.dayOfWeek} onValueChange={v => setForm(p => ({ ...p, dayOfWeek: v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => (
                        <SelectItem key={d} value={String(i + 1)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hour (24h)</Label>
                  <Select value={form.hour} onValueChange={v => setForm(p => ({ ...p, hour: v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={String(i)}>{i.toString().padStart(2, '0')}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minute</Label>
                  <Select value={form.minute} onValueChange={v => setForm(p => ({ ...p, minute: v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '15', '30', '45'].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full rounded-xl mt-4">Save Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl font-semibold mb-2">No reminders set</h2>
          <p className="text-muted-foreground text-sm">We'll nudge you to keep up with your reading goals.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reminders.map(r => (
            <Card key={r.id} className="p-5 flex items-start justify-between group hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={r.type === 'DAILY' ? 'default' : 'secondary'} className="text-[10px]">
                    {r.type}
                  </Badge>
                  {r.type === 'WEEKLY' && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> {DAYS[(r.dayOfWeek || 1) - 1]}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {formatTime(r.scheduleTime)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Time to read!</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}