import { portfolioHoldings } from '@/lib/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const HoldingsTable = () => {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Holdings</h2>
        <span className="text-xs text-muted-foreground">{portfolioHoldings.length} positions</span>
      </div>
      <div className="space-y-1">
        {portfolioHoldings.map((h) => {
          const value = h.shares * h.currentPrice;
          const pl = (h.currentPrice - h.avgCost) * h.shares;
          const isUp = h.changePercent >= 0;
          return (
            <div
              key={h.symbol}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-card transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                  {h.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{h.symbol}</div>
                  <div className="text-xs text-muted-foreground">{h.shares} shares</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">{fmt(value)}</div>
                <div className={`flex items-center justify-end gap-1 text-xs ${isUp ? 'text-gain' : 'text-loss'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isUp ? '+' : ''}{h.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoldingsTable;
