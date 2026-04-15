import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles, TrendingUp, BarChart3, RefreshCw, Mic, MicOff, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

const QUICK_ACTIONS = [
  { label: 'Analyze NVDA', icon: BarChart3, prompt: 'Analyze NVDA with full technical and fundamental analysis including P/E, RSI, MACD, and fair value estimate' },
  { label: 'Portfolio Review', icon: TrendingUp, prompt: 'Review my current portfolio. Show allocation breakdown, risk metrics, and suggest optimizations' },
  { label: 'Find Opportunities', icon: Sparkles, prompt: 'Scan the market for top momentum plays and undervalued stocks today. Include risk scores.' },
  { label: 'Rebalance', icon: RefreshCw, prompt: 'Analyze my portfolio vs target allocation and recommend specific rebalancing trades' },
];

const INITIAL_MESSAGES: Msg[] = [
  {
    role: 'assistant',
    content: `Hey! I'm **InveStarAnalyst**, your AI investment advisor. 🤖\n\nI can:\n- **Analyze** any stock/crypto with CFA-level depth\n- **Execute trades** — just say "buy $500 of AAPL"\n- **Voice commands** — tap the 🎤 to speak\n- **Optimize** your portfolio allocation\n\nWhat would you like to do?`,
  },
];

const ClawbotChat = () => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Trade execution parser ---
  const checkAndExecuteTrade = useCallback(async (assistantText: string) => {
    // Look for trade blocks in assistant response
    const tradeMatch = assistantText.match(/\[TRADE\]\s*(BUY|SELL)\s*\$?([\d,]+(?:\.\d+)?)\s*(?:of\s+)?([A-Z]{1,5})/i);
    if (!tradeMatch || !session) return;

    const side = tradeMatch[1].toUpperCase();
    const amount = parseFloat(tradeMatch[2].replace(/,/g, ''));
    const symbol = tradeMatch[3].toUpperCase();

    if (side !== 'BUY') {
      toast.info('🔒 Sell orders require manual approval in your brokerage.');
      return;
    }

    toast.info(`📊 Executing: BUY $${amount.toLocaleString()} of ${symbol}...`);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alpaca-invest`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          symbol,
          notional: amount,
          type: 'market',
          aiRationale: `AI-initiated trade from chat`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ ${data.message}`);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Trade Executed!**\n\n- **Symbol:** ${symbol}\n- **Amount:** $${amount.toLocaleString()}\n- **Status:** Filled\n\n${data.message}`,
        }]);
      } else {
        toast.error(data.message || data.error || 'Trade failed');
      }
    } catch {
      toast.error('Failed to execute trade. Check your connection.');
    }
  }, [session]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Msg = { role: 'user', content: msg };
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const allMessages = [...messages, userMsg];

    try {
      const fnName = session ? 'investar-chat' : 'clawbot-chat';
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fnName}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) throw new Error(`Error ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantSoFar = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
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

      // After streaming completes, check for trade commands
      if (assistantSoFar) {
        checkAndExecuteTrade(assistantSoFar);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice (Web Speech API) ---
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);

      // Auto-send on final result
      if (event.results[event.results.length - 1].isFinal) {
        setTimeout(() => {
          send(transcript);
          setIsListening(false);
        }, 300);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition error. Try again.');
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [isListening, send]);

  const showQuickActions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">InveStarAnalyst</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gain pulse-dot" />
            CFA Advisor · Voice + Trade Enabled
          </div>
        </div>
        <button onClick={toggleVoice} title={isListening ? 'Stop listening' : 'Voice command'}
          className={`p-2 rounded-lg transition-all ${
            isListening
              ? 'bg-loss/20 text-loss animate-pulse'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}>
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>

      {isListening && (
        <div className="px-4 py-2 bg-loss/10 border-b border-loss/20 flex items-center gap-2">
          <div className="flex gap-0.5 items-center">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1 bg-loss rounded-full animate-pulse"
                style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <span className="text-xs text-loss font-medium">Listening... speak your command</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md'
                : 'text-foreground'
            }`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_li]:text-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-sm">{m.content}</span>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {showQuickActions && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} onClick={() => send(a.prompt)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left">
                <a.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs text-foreground font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground pl-10">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">Analyzing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2 items-end">
          <button onClick={toggleVoice} title="Voice input"
            className={`p-2.5 rounded-xl transition-all ${
              isListening ? 'bg-loss text-white animate-pulse' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}>
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={isListening ? 'Listening...' : 'Ask anything or say "buy $500 of AAPL"...'}
            className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          <button onClick={() => send()} disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-30 transition-all">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 px-1">
          <Volume2 className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Voice + Chat · Say "buy $1000 of NVDA" to trade</span>
        </div>
      </div>
    </div>
  );
};

export default ClawbotChat;
