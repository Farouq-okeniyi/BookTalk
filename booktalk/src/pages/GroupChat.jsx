import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { groupsApi, messagesApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function GroupChat() {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getById(groupId),
    enabled: !!groupId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: () => messagesApi.filter({ group_id: groupId }),
    initialData: [],
    enabled: !!groupId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await messagesApi.create({
      group_id: groupId,
      content: message,
    });
    setMessage('');
    queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!group) {
    return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <Link to="/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg font-bold truncate">{group.name}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {group.memberCount || 1} members
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No messages yet. Start the discussion!</p>
          </div>
        )}
        {[...messages].reverse().map((msg, index) => { // DTO might return newest first, so we reverse it for bottom-up display depending on api behavior. Wait, PageDto usually defaults to newest first? No, let's keep it index based.
          const isMe = msg.sender?.email === user?.email || msg.sender?.username === user?.username || msg.author_email === user?.email;
          const senderName = msg.sender?.name || msg.sender?.username || msg.author_name || 'Unknown';
          const content = msg.content || msg.body;
          const dateStr = msg.sentAt || msg.created_date || msg.createdAt;

          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'order-1' : ''}`}>
                {!isMe && (
                  <p className="text-[10px] font-medium text-muted-foreground mb-1 ml-1">
                    {senderName}
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{content}</p>
                </div>
                <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {dateStr ? format(new Date(dateStr), 'h:mm a') : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="rounded-xl flex-1"
        />
        <Button onClick={handleSend} className="rounded-xl px-4" disabled={!message.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}