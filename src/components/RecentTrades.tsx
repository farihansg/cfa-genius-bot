import { recentTrades } from '@/lib/mockData';

const RecentTrades = () => {
  return (
    <div className="panel-border bg-card p-3">
      <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Trades</h2>
      <div className="space-y-1.5 text-xs">
        {recentTrades.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-1 border-b border-border/30">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                t.action === 'BUY' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'
              }`}>{t.action}</span>
              <span className="font-semibold text-secondary">{t.symbol}</span>
              <span className="text-muted-foreground">{t.shares} @ ${t.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{t.strategy}</span>
              <span className={`text-[10px] px-1 rounded ${
                t.status === 'executed' ? 'text-gain' : 
                t.status === 'pending' ? 'text-warning' : 'text-loss'
              }`}>●</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;
