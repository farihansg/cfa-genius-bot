const strategies = [
  { name: 'Value Investing', status: 'active', allocation: 25, pnl: '+12.4%' },
  { name: 'Growth Momentum', status: 'active', allocation: 30, pnl: '+28.7%' },
  { name: 'Dividend Income', status: 'active', allocation: 20, pnl: '+8.2%' },
  { name: 'Day Trading', status: 'active', allocation: 15, pnl: '+5.1%' },
  { name: 'REIT Portfolio', status: 'active', allocation: 10, pnl: '+6.8%' },
];

const StrategyPanel = () => {
  return (
    <div className="panel-border bg-card p-3">
      <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Strategies</h2>
      <div className="space-y-2">
        {strategies.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gain" />
              <span className="text-foreground">{s.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{s.allocation}%</span>
              <div className="w-16 bg-muted/50 rounded-full h-1">
                <div className="bg-primary h-1 rounded-full" style={{ width: `${s.allocation * 3.3}%` }} />
              </div>
              <span className="text-gain w-14 text-right">{s.pnl}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-border/50 flex justify-between text-[10px] text-muted-foreground">
        <span>Auto-invest: <span className="text-gain font-medium">ON</span></span>
        <span>Withdrawals: <span className="text-loss font-medium">LOCKED</span></span>
      </div>
    </div>
  );
};

export default StrategyPanel;
