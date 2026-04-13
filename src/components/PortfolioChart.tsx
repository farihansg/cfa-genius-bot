import { useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { generateChartData, getPortfolioStats } from '@/lib/mockData';

const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;
const daysMap: Record<string, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, 'ALL': 730 };

const PortfolioChart = () => {
  const [range, setRange] = useState<string>('1M');
  const stats = getPortfolioStats();
  const data = useMemo(() => generateChartData(daysMap[range]), [range]);
  const isPositive = stats.dayChange >= 0;
  const color = isPositive ? 'hsl(145, 72%, 40%)' : 'hsl(0, 72%, 51%)';

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="p-6">
      {/* Portfolio Value */}
      <div className="mb-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{fmt(stats.totalValue)}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? '+' : ''}{fmt(stats.dayChange)} ({stats.dayChangePercent.toFixed(2)}%)
          </span>
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 mt-4 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip
              contentStyle={{
                background: 'hsl(220, 14%, 8%)',
                border: '1px solid hsl(220, 12%, 15%)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(0, 0%, 95%)',
              }}
              formatter={(value: number) => [fmt(value), 'Value']}
              labelStyle={{ color: 'hsl(220, 10%, 50%)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'hsl(220, 14%, 6%)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-1 mt-2">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              range === r
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PortfolioChart;
