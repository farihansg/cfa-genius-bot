import { getPortfolioStats } from '@/lib/mockData';

const PortfolioSummary = () => {
  const stats = getPortfolioStats();

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="panel-border bg-card p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs text-muted-foreground uppercase tracking-wider">Portfolio Overview</h2>
        <span className="text-[10px] text-muted-foreground">LIVE</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Total Value</div>
          <div className="text-lg font-bold text-foreground terminal-glow">{fmt(stats.totalValue)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Day P&L</div>
          <div className={`text-lg font-bold ${stats.dayChange >= 0 ? 'text-gain' : 'text-loss'}`}>
            {stats.dayChange >= 0 ? '+' : ''}{fmt(stats.dayChange)}
            <span className="text-xs ml-1">({stats.dayChangePercent.toFixed(2)}%)</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Total P&L</div>
          <div className={`text-sm font-semibold ${stats.totalGain >= 0 ? 'text-gain' : 'text-loss'}`}>
            {stats.totalGain >= 0 ? '+' : ''}{fmt(stats.totalGain)} ({stats.totalGainPercent.toFixed(2)}%)
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Cash / Buying Power</div>
          <div className="text-sm text-foreground">{fmt(stats.cashBalance)} / {fmt(stats.buyingPower)}</div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
