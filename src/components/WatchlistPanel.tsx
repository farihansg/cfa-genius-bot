import { watchlist } from '@/lib/mockData';

const WatchlistPanel = () => {
  const signalColor = (s: string) => {
    switch (s) {
      case 'BUY': return 'text-gain bg-gain/15';
      case 'SELL': return 'text-loss bg-loss/15';
      case 'HOLD': return 'text-warning bg-warning/15';
      default: return 'text-info bg-info/15';
    }
  };

  return (
    <div className="panel-border bg-card p-3">
      <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Watchlist & Signals</h2>
      <div className="space-y-1">
        {watchlist.map((w) => (
          <div key={w.symbol} className="flex items-center justify-between py-1.5 border-b border-border/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-secondary w-12">{w.symbol}</span>
              <span className="text-muted-foreground text-[10px] hidden sm:inline">{w.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>${w.price.toFixed(2)}</span>
              <span className={`w-16 text-right ${w.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                {w.change >= 0 ? '+' : ''}{w.changePercent.toFixed(2)}%
              </span>
              <span className="text-muted-foreground w-12 text-right">{w.volume}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${signalColor(w.signal)}`}>
                {w.signal}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistPanel;
