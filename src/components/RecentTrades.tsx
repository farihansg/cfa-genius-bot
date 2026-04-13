import { recentTrades } from '@/lib/mockData';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const RecentTrades = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
      </div>
      <div className="space-y-1">
        {recentTrades.map((t) => {
          const isBuy = t.action === 'BUY';
          return (
            <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isBuy ? 'bg-gain/10' : 'bg-loss/10'
                }`}>
                  {isBuy
                    ? <ArrowUpRight className="w-4 h-4 text-gain" />
                    : <ArrowDownRight className="w-4 h-4 text-loss" />
                  }
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {t.action} {t.symbol}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.shares} shares · ${t.price.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{t.strategy}</div>
                <div className={`text-[11px] font-medium ${
                  t.status === 'executed' ? 'text-gain' : 
                  t.status === 'pending' ? 'text-warning' : 'text-loss'
                }`}>
                  {t.status === 'executed' ? '✓ Filled' : t.status === 'pending' ? '◯ Pending' : '✕ Cancelled'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTrades;
