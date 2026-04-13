import { Zap, Lock } from 'lucide-react';

const strategies = [
  { name: 'Value Investing', allocation: 25, pnl: 12.4, color: 'bg-info' },
  { name: 'Growth Momentum', allocation: 30, pnl: 28.7, color: 'bg-gain' },
  { name: 'Dividend Income', allocation: 20, pnl: 8.2, color: 'bg-warning' },
  { name: 'Day Trading', allocation: 15, pnl: 5.1, color: 'bg-purple-500' },
  { name: 'REIT Portfolio', allocation: 10, pnl: 6.8, color: 'bg-pink-500' },
];

const StrategyPanel = () => {
  return (
    <div className="px-6">
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">AI Strategies</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-gain font-medium">
              <Zap className="w-3 h-3" /> Auto-invest ON
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" /> Withdrawals locked
            </span>
          </div>
        </div>

        {/* Allocation bar */}
        <div className="flex rounded-full overflow-hidden h-2 mb-4">
          {strategies.map((s) => (
            <div key={s.name} className={`${s.color}`} style={{ width: `${s.allocation}%` }} />
          ))}
        </div>

        {/* Strategy list */}
        <div className="space-y-2">
          {strategies.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-sm text-foreground">{s.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-10 text-right">{s.allocation}%</span>
                <span className={`text-xs font-semibold w-16 text-right ${s.pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                  +{s.pnl}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;
