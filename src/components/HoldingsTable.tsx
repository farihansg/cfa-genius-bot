import { portfolioHoldings } from '@/lib/mockData';

const HoldingsTable = () => {
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="panel-border bg-card p-3 flex-1 overflow-auto">
      <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Holdings</h2>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left py-1 font-medium">Symbol</th>
            <th className="text-right py-1 font-medium">Shares</th>
            <th className="text-right py-1 font-medium">Price</th>
            <th className="text-right py-1 font-medium">Chg%</th>
            <th className="text-right py-1 font-medium">Value</th>
            <th className="text-right py-1 font-medium">P&L</th>
            <th className="text-left py-1 font-medium pl-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {portfolioHoldings.map((h) => {
            const value = h.shares * h.currentPrice;
            const pl = (h.currentPrice - h.avgCost) * h.shares;
            const plPct = ((h.currentPrice - h.avgCost) / h.avgCost) * 100;
            return (
              <tr key={h.symbol} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-1.5 font-semibold text-secondary">{h.symbol}</td>
                <td className="text-right py-1.5">{h.shares}</td>
                <td className="text-right py-1.5">{fmt(h.currentPrice)}</td>
                <td className={`text-right py-1.5 ${h.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {h.changePercent >= 0 ? '+' : ''}{h.changePercent.toFixed(2)}%
                </td>
                <td className="text-right py-1.5">{fmt(value)}</td>
                <td className={`text-right py-1.5 ${pl >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {pl >= 0 ? '+' : ''}{fmt(pl)} ({plPct.toFixed(1)}%)
                </td>
                <td className="text-left py-1.5 pl-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${
                    h.type === 'reit' ? 'bg-info/20 text-info' :
                    h.type === 'etf' ? 'bg-warning/20 text-warning' :
                    'bg-primary/20 text-primary'
                  }`}>{h.type}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HoldingsTable;
