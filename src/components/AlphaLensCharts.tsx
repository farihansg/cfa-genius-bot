import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, Area, AreaChart,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

type Annual = {
  year: string;
  revenue?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  fcf?: number;
  roic?: number;
  epsGrowth?: number;
};

type ValHistory = {
  year: string;
  pe?: number | null;
  evEbitda?: number | null;
  ps?: number | null;
  pfcf?: number | null;
};

interface Props {
  annual?: Annual[];
  valuationHistory?: ValHistory[];
  unitNote?: string;
}

const TABS = [
  { id: 'revenue', label: 'Revenue & Growth' },
  { id: 'margins', label: 'Margins' },
  { id: 'fcf', label: 'Free Cash Flow' },
  { id: 'roic', label: 'ROIC' },
  { id: 'valuation', label: 'Valuation Multiples' },
] as const;

type TabId = typeof TABS[number]['id'];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
};

const axisProps = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

export default function AlphaLensCharts({ annual = [], valuationHistory = [], unitNote }: Props) {
  const [tab, setTab] = useState<TabId>('revenue');

  const revenueData = useMemo(
    () =>
      annual.map((a, i) => {
        const prev = annual[i - 1]?.revenue;
        const yoy = prev && a.revenue ? ((a.revenue - prev) / prev) * 100 : null;
        return { year: a.year, revenue: a.revenue ?? null, yoy: yoy != null ? +yoy.toFixed(1) : null };
      }),
    [annual],
  );

  const hasAnnual = annual.length > 0;
  const hasVal = valuationHistory.length > 0;

  if (!hasAnnual && !hasVal) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="w-4 h-4 text-primary" /> Financial Charts
        </h2>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => {
            const disabled = t.id === 'valuation' ? !hasVal : !hasAnnual;
            return (
              <button
                key={t.id}
                disabled={disabled}
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {tab === 'revenue' ? (
            <ComposedChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis yAxisId="left" {...axisProps} tickFormatter={(v) => `$${v}B`} />
              <YAxis yAxisId="right" orientation="right" {...axisProps} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: any, n: string) =>
                  n === 'Revenue' ? [`$${v}B`, n] : [`${v}%`, n]
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="yoy"
                name="YoY Growth"
                stroke="hsl(145, 72%, 50%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          ) : tab === 'margins' ? (
            <LineChart data={annual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="grossMargin" name="Gross" stroke="hsl(145, 72%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="operatingMargin" name="Operating" stroke="hsl(210, 90%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netMargin" name="Net" stroke="hsl(280, 80%, 65%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : tab === 'fcf' ? (
            <AreaChart data={annual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fcfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(145, 72%, 50%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(145, 72%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${v}B`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${v}B`, 'FCF']} />
              <Area
                type="monotone"
                dataKey="fcf"
                name="Free Cash Flow"
                stroke="hsl(145, 72%, 50%)"
                strokeWidth={2}
                fill="url(#fcfGrad)"
              />
            </AreaChart>
          ) : tab === 'roic' ? (
            <ComposedChart data={annual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="roic" name="ROIC" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="epsGrowth" name="EPS Growth" stroke="hsl(35, 90%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          ) : (
            <LineChart data={valuationHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}x`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="pe" name="P/E" stroke="hsl(210, 90%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="evEbitda" name="EV/EBITDA" stroke="hsl(145, 72%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="ps" name="P/S" stroke="hsl(280, 80%, 65%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="pfcf" name="P/FCF" stroke="hsl(35, 90%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {unitNote && <p className="text-[11px] text-muted-foreground italic mt-3">{unitNote}</p>}
    </div>
  );
}
