import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { groupsApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Groups() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const queryClient = useQueryClient();

  // The backend /groups/me API only returns groups the user is a member of. 
  // There is no public group discovery endpoint in the new API without an invite.
  const { data: myGroups = [], isLoading } = useQuery({
    queryKey: ['groups', 'me'],
    queryFn: () => groupsApi.list(),
    initialData: [],
  });

  const handleCreate = async () => {
    if (!form.name) {
      toast.error('Group name is required');
      return;
    }
    await groupsApi.create({
      name: form.name,
      description: form.description
    });
    setForm({ name: '', description: '' });
    setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ['groups', 'me'] });
    toast.success('Group created!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Reading Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">Discuss books with your invited friends</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Create a Discussion Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  placeholder="e.g. Monday Book Club"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="What's this group about?"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleCreate} className="w-full rounded-xl">Create Group</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-semibold mb-4">My Groups</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {myGroups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && myGroups.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-heading text-xl font-semibold mb-2">No groups yet</h2>
          <p className="text-muted-foreground text-sm">Create the first reading group!</p>
        </div>
      )}
    </div>
  );
}

function GroupCard({ group }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{group.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0">
          <Users className="w-3 h-3 mr-1" />
          {group.memberCount || 1}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <Link to={`/group/${group.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full rounded-xl gap-2">
            <MessageCircle className="w-4 h-4" /> Open Discussion
          </Button>
        </Link>
      </div>
    </Card>
  );
}