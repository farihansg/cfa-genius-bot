import { getPortfolioStats } from '@/lib/mockData';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const PortfolioSummary = () => {
  const stats = getPortfolioStats();
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const cards = [
    {
      label: 'Total P&L',
      value: `${stats.totalGain >= 0 ? '+' : ''}${fmt(stats.totalGain)}`,
      sub: `${stats.totalGainPercent.toFixed(2)}% all time`,
      icon: stats.totalGain >= 0 ? TrendingUp : TrendingDown,
      positive: stats.totalGain >= 0,
    },
    {
      label: 'Cash Balance',
      value: fmt(stats.cashBalance),
      sub: 'Available',
      icon: Wallet,
      positive: true,
    },
    {
      label: 'Buying Power',
      value: fmt(stats.buyingPower),
      sub: '2x margin',
      icon: DollarSign,
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <c.icon className={`w-4 h-4 ${c.positive ? 'text-gain' : 'text-loss'}`} />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <div className={`text-lg font-bold ${c.label === 'Total P&L' ? (c.positive ? 'text-gain' : 'text-loss') : 'text-foreground'}`}>
            {c.value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioSummary;
