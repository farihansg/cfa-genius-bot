import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const INITIAL_MESSAGES: Msg[] = [
  {
    role: 'assistant',
    content: `🤖 **CLAWBOT v2.4 — CFA Financial Advisor**\n\nStrategies active: Value · Growth · Dividend · Day Trading\n\nI can:\n• Analyze stocks & REITs\n• Execute simulated trades\n• Rebalance your portfolio\n• Scan for momentum plays\n• Evaluate dividend yields\n\nType a command or ask me anything about your portfolio.`,
  },
];

const ClawbotChat = () => {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: 'user', content: text };
    setInput('');
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const allMessages = [...messages, userMsg];

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clawbot-chat`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantSoFar = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && prev.length > INITIAL_MESSAGES.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠ Connection error. Retrying...' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel-border bg-card flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Bot className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary terminal-glow">CLAWBOT</span>
        <span className="text-[10px] text-muted-foreground ml-auto">CFA Advisor • v2.4</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <Bot className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />}
            <div className={`max-w-[85%] whitespace-pre-wrap leading-relaxed ${
              m.role === 'user'
                ? 'bg-muted/50 text-foreground px-3 py-2 rounded'
                : 'text-foreground'
            }`}>
              {m.content}
            </div>
            {m.role === 'user' && <User className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px]">Processing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Clawbot... (e.g. 'analyze AAPL' or 'buy 50 NVDA')"
            className="flex-1 bg-muted/30 border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-primary/80 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClawbotChat;
