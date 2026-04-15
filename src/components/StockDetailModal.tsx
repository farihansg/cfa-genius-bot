import { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, Sparkles, BarChart3, Activity, DollarSign } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface StockDetailModalProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  onClose: () => void;
}

const timeRanges = ['1D', '1W', '1M', '3M', '1Y'] as const;
const daysMap: Record<string, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };

function generateStockChart(days: number, basePrice: number) {
  const data = [];
  let price = basePrice;
  const points = Math.min(days * 6, 200);
  const msPerPoint = (days * 24 * 60 * 60 * 1000) / points;
  const now = Date.now();

  for (let i = 0; i < points; i++) {
    const vol = 0.02;
    const drift = 0.0002;
    price += price * (drift + vol * (Math.random() - 0.48));
    const volume = Math.floor(Math.random() * 5000000 + 500000);
    data.push({
      time: new Date(now - (points - i) * msPerPoint).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.round(price * 100) / 100,
      volume,
    });
  }
  return data;
}

// Mock key stats
function getKeyStats(symbol: string, price: number) {
  const r = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
  return {
    marketCap: `$${(price * r(50, 500)).toFixed(0)}B`,
    pe: r(12, 45).toFixed(1),
    eps: r(2, 15).toFixed(2),
    dividend: `${r(0, 3.5).toFixed(2)}%`,
    beta: r(0.6, 1.8).toFixed(2),
    week52High: `$${(price * r(1.05, 1.35)).toFixed(2)}`,
    week52Low: `$${(price * r(0.6, 0.95)).toFixed(2)}`,
    avgVolume: `${r(5, 80).toFixed(1)}M`,
    rsi: r(25, 75).toFixed(0),
    macd: r(-3, 3).toFixed(2),
  };
}

const StockDetailModal = ({ symbol, name, price, changePercent, onClose }: StockDetailModalProps) => {
  const { session } = useAuth();
  const [range, setRange] = useState<string>('1M');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const chartData = useMemo(() => generateStockChart(daysMap[range], price), [range, price]);
  const stats = useMemo(() => getKeyStats(symbol, price), [symbol, price]);
  const isPositive = changePercent >= 0;
  const color = isPositive ? 'hsl(145, 72%, 40%)' : 'hsl(0, 72%, 51%)';
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  async function fetchAIAnalysis() {
    if (!session || aiLoading) return;
    setAiLoading(true);
    setAiAnalysis('');
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investar-chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Give me a complete CFA-level analysis of ${symbol} (${name}). Include: 1) Current valuation assessment 2) Technical signals (RSI, MACD, support/resistance) 3) Key catalysts and risks 4) Fair value estimate 5) Overall recommendation with risk score. Be concise but thorough.`,
          }],
        }),
      });

      if (!res.ok || !res.body) throw new Error('Failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

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
            if (content) { full += content; setAiAnalysis(full); }
          } catch {}
        }
      }
    } catch {
      setAiAnalysis('Could not load AI analysis.');
    }
    setAiLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
              {symbol.slice(0, 2)}
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{symbol}</div>
              <div className="text-xs text-muted-foreground">{name}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-foreground font-mono">{fmt(price)}</div>
              <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Price Chart */}
        <div className="p-5">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <XAxis dataKey="time" hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(220, 14%, 8%)', border: '1px solid hsl(220, 12%, 15%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(0, 0%, 95%)' }}
                  formatter={(v: number) => [fmt(v), 'Price']}
                />
                <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2}
                  fill={`url(#grad-${symbol})`} dot={false}
                  activeDot={{ r: 4, fill: color, stroke: 'hsl(220, 14%, 6%)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="h-16 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="volume" fill="hsl(220, 12%, 18%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time Range */}
          <div className="flex gap-1 mt-3">
            {timeRanges.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="px-5 pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Key Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Market Cap', value: stats.marketCap, icon: DollarSign },
              { label: 'P/E Ratio', value: stats.pe, icon: Activity },
              { label: 'EPS', value: `$${stats.eps}`, icon: TrendingUp },
              { label: 'Dividend Yield', value: stats.dividend, icon: DollarSign },
              { label: 'Beta', value: stats.beta, icon: Activity },
              { label: '52W High', value: stats.week52High, icon: TrendingUp },
              { label: '52W Low', value: stats.week52Low, icon: TrendingDown },
              { label: 'Avg Volume', value: stats.avgVolume, icon: BarChart3 },
              { label: 'RSI', value: stats.rsi, icon: Activity },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-3">
                <div className="text-[11px] text-muted-foreground mb-1">{s.label}</div>
                <div className="text-sm font-semibold text-foreground font-mono">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="px-5 pb-5">
          {!aiAnalysis && !aiLoading && (
            <button onClick={fetchAIAnalysis}
              className="w-full bg-primary/10 border border-primary/20 text-primary py-3 rounded-xl text-sm font-medium hover:bg-primary/15 transition-colors flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Get AI Analysis
            </button>
          )}
          {aiLoading && !aiAnalysis && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Running CFA-level analysis...</span>
            </div>
          )}
          {aiAnalysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> InveStarAnalyst AI Analysis
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_li]:text-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:text-primary [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
