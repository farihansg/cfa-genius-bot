import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STOCKS = ['VTI','SPY','QQQ','AAPL','MSFT','GOOGL','AMZN','NVDA','JPM','JNJ'];
const REITS = ['VNQ','O','AMT','PLD','SPG','WELL','DLR','AVB','EQR','PSA'];
const CRYPTO = ['BTC','ETH','SOL','ADA','DOGE','AVAX','MATIC','DOT','LINK','UNI'];

type AssetClass = 'stock' | 'reit' | 'crypto';
type OrderType = 'market' | 'limit';

const InvestPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [assetClass, setAssetClass] = useState<AssetClass>('stock');
  const [symbol, setSymbol] = useState('VTI');
  const [amount, setAmount] = useState('1000');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const tickers = assetClass === 'reit' ? REITS : assetClass === 'crypto' ? CRYPTO : STOCKS;

  function onAssetChange(cls: AssetClass) {
    setAssetClass(cls);
    setSymbol(cls === 'reit' ? 'VNQ' : cls === 'crypto' ? 'BTC' : 'VTI');
    setResult(null);
    setAiRationale('');
  }

  async function getAIOpinion() {
    if (!session) return;
    setAiLoading(true);
    setAiRationale('');
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
            content: `I'm about to buy $${amount} of ${symbol} as a ${orderType} order. Give me a concise CFA-level assessment: is this a good idea right now? Key risks and opportunities? 3-4 sentences max.`,
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
            if (content) {
              full += content;
              setAiRationale(full);
            }
          } catch {}
        }
      }
    } catch {
      setAiRationale('Could not fetch AI opinion.');
    }
    setAiLoading(false);
  }

  async function placeOrder() {
    if (!session || !amount || Number(amount) < 1) return;
    setLoading(true);
    setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alpaca-invest`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          symbol, notional: Number(amount), type: orderType,
          limitPrice: limitPrice ? Number(limitPrice) : undefined,
          aiRationale,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) toast.success(data.message);
      else toast.error(data.message || data.error);
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground">InveStarAnalyst</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Place Buy Order
        </h1>

        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          {/* Asset class tabs */}
          <div className="flex gap-2">
            {(['stock', 'reit', 'crypto'] as AssetClass[]).map(cls => (
              <button key={cls} onClick={() => onAssetChange(cls)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                  assetClass === cls ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}>
                {cls === 'reit' ? 'REIT' : cls === 'crypto' ? 'Crypto' : 'Stock / ETF'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Ticker</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground">
              {tickers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Amount (USD)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Order Type</label>
            <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)}
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground">
              <option value="market">Market (executes immediately)</option>
              <option value="limit">Limit (set a price)</option>
            </select>
          </div>

          {orderType === 'limit' && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Limit Price ($)</label>
              <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                placeholder="e.g. 245.00"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground" />
            </div>
          )}

          {/* AI Opinion */}
          {aiRationale && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-primary mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Analysis
              </div>
              <p className="text-xs text-foreground leading-relaxed">{aiRationale}</p>
            </div>
          )}

          {result && (
            <div className={`rounded-xl p-3 text-xs ${result.success ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss'}`}>
              {result.message}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={getAIOpinion} disabled={aiLoading}
              className="flex-1 bg-muted text-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-muted/80 disabled:opacity-40 flex items-center justify-center gap-2">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
              AI Opinion
            </button>
            <button onClick={placeOrder} disabled={loading || !amount}
              className="flex-1 bg-gain text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gain/90 disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Buy ${Number(amount).toLocaleString()} {symbol}
            </button>
          </div>
        </div>

        {/* Withdrawal notice */}
        <div className="mt-4 bg-card rounded-2xl border border-warning/20 p-4">
          <div className="text-xs font-semibold text-warning mb-1">🔒 Withdrawal Locked</div>
          <p className="text-[11px] text-muted-foreground">
            InveStarAnalyst can only execute buy orders. Withdrawals require your manual action in your brokerage account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestPage;
