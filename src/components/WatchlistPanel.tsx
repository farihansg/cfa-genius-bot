import { watchlist } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

const WatchlistPanel = () => {
  const signalStyle = (s: string) => {
    switch (s) {
      case 'BUY': return 'text-gain bg-gain/10 border-gain/20';
      case 'SELL': return 'text-loss bg-loss/10 border-loss/20';
      case 'HOLD': return 'text-warning bg-warning/10 border-warning/20';
      default: return 'text-info bg-info/10 border-info/20';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Watchlist</h2>
      </div>
      <div className="space-y-1">
        {watchlist.map((w) => {
          const isUp = w.changePercent >= 0;
          return (
            <div key={w.symbol} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                  {w.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{w.symbol}</div>
                  <div className="text-[11px] text-muted-foreground">{w.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground font-mono">${w.price.toFixed(2)}</div>
                  <div className={`flex items-center justify-end gap-0.5 text-[11px] ${isUp ? 'text-gain' : 'text-loss'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isUp ? '+' : ''}{w.changePercent.toFixed(2)}%
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${signalStyle(w.signal)}`}>
                  {w.signal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WatchlistPanel;
