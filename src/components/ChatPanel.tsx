import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useRoom';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  className?: string;
}

export function ChatPanel({ messages, currentUserId, onSendMessage, className }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Chat</h3>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'animate-fade-in',
                msg.sender_id === currentUserId ? 'text-right' : 'text-left'
              )}
            >
              <div className={cn(
                'inline-block max-w-[85%] rounded-lg px-3 py-2',
                msg.sender_id === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}>
                <p className={cn(
                  'text-xs font-medium mb-1',
                  msg.sender_id === currentUserId
                    ? 'text-primary-foreground/80'
                    : 'text-muted-foreground'
                )}>
                  {msg.sender_name}
                </p>
                <p className="text-sm break-words">{msg.message}</p>
                <p className={cn(
                  'text-[10px] mt-1',
                  msg.sender_id === currentUserId
                    ? 'text-primary-foreground/60'
                    : 'text-muted-foreground'
                )}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
