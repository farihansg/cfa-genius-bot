import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Sparkles, Loader2, TrendingUp, TrendingDown, Shield, Target, Brain, AlertTriangle, BarChart3, Award, Activity, DollarSign } from 'lucide-react';

type Analysis = any;

const HORIZONS = ['1M', '3M', '1Y', '5Y'];
const RISKS = ['Conservative', 'Moderate', 'Aggressive'];

const gradeColor = (g: string) => {
  if (g?.startsWith('A')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (g?.startsWith('B')) return 'text-lime-400 bg-lime-500/10 border-lime-500/30';
  if (g?.startsWith('C')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  if (g?.startsWith('D')) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  if (g?.startsWith('F')) return 'text-red-400 bg-red-500/10 border-red-500/30';
  return 'text-muted-foreground bg-muted border-border';
};

const verdictColor = (v: string) => {
  if (v === 'Strong Buy' || v === 'Buy' || v === 'Bullish') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (v === 'Hold' || v === 'Neutral') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
};

const scoreColor = (n: number) => n >= 75 ? 'text-emerald-400' : n >= 55 ? 'text-yellow-400' : n >= 40 ? 'text-orange-400' : 'text-red-400';

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className={`font-mono font-semibold ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${value >= 75 ? 'bg-emerald-500' : value >= 55 ? 'bg-yellow-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </h2>
      {children}
    </div>
  );
}

export default function AlphaLens() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [ticker, setTicker] = useState('');
  const [company, setCompany] = useState('');
  const [horizon, setHorizon] = useState('1Y');
  const [risk, setRisk] = useState('Moderate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState('');

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alphalens-analyze`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ticker: ticker.toUpperCase().trim(), company: company.trim(), horizon, riskProfile: risk }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-base font-bold text-foreground">AlphaLens</div>
            <div className="text-[11px] text-muted-foreground">Institutional-grade AI equity research</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Input */}
        <form onSubmit={analyze} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ticker *</label>
              <input value={ticker} onChange={e => setTicker(e.target.value)} placeholder="NVDA, TSLA, META..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Company (optional)</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="NVIDIA Corp"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Horizon</label>
              <div className="flex gap-1">
                {HORIZONS.map(h => (
                  <button type="button" key={h} onClick={() => setHorizon(h)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium ${horizon === h ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Risk profile</label>
              <div className="flex gap-1">
                {RISKS.map(r => (
                  <button type="button" key={r} onClick={() => setRisk(r)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium ${risk === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading || !ticker.trim()}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Running institutional analysis...</> : <><Sparkles className="w-4 h-4" /> Generate Investment Memo</>}
          </button>
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}
        </form>

        {loading && (
          <div className="text-center text-sm text-muted-foreground py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
            Modeling DCF, peer multiples, moat, and risk... this may take 30-60s.
          </div>
        )}

        {result && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-gradient-to-br from-primary/10 to-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="text-2xl font-bold text-foreground">{result.ticker} <span className="text-muted-foreground text-base font-normal">· {result.company}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">{result.horizon} horizon · {result.riskProfile} risk</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className={`text-4xl font-bold font-mono ${scoreColor(result.quantScore?.overall ?? 0)}`}>{result.quantScore?.overall ?? '—'}</div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Quant Score</div>
                  </div>
                  <div className="text-center">
                    <span className={`px-3 py-1.5 rounded-md text-xs font-bold border ${verdictColor(result.finalDecision?.verdict)}`}>{result.finalDecision?.verdict}</span>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1">{result.quantScore?.conviction} conviction</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <Section icon={Award} title="Executive Summary">
              <p className="text-sm text-foreground/90 mb-3">{result.executiveSummary?.overview}</p>
              <div className="text-sm text-foreground mb-4 italic border-l-2 border-primary pl-3">{result.executiveSummary?.thesis}</div>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Bull Case</div>
                  <ul className="space-y-1 text-xs text-foreground/90">{result.executiveSummary?.bullCase?.map((b: string, i: number) => <li key={i}>• {b}</li>)}</ul>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Bear Case</div>
                  <ul className="space-y-1 text-xs text-foreground/90">{result.executiveSummary?.bearCase?.map((b: string, i: number) => <li key={i}>• {b}</li>)}</ul>
                </div>
              </div>
              {result.executiveSummary?.catalysts?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-1">Key Catalysts</div>
                  <ul className="text-xs text-muted-foreground space-y-1">{result.executiveSummary.catalysts.map((c: string, i: number) => <li key={i}>→ {c}</li>)}</ul>
                </div>
              )}
            </Section>

            {/* Quant Score */}
            <Section icon={BarChart3} title="AI Quant Score Breakdown">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {result.quantScore?.components && Object.entries(result.quantScore.components).map(([k, v]: any) => (
                  <ScoreBar key={k} label={k.replace(/([A-Z])/g, ' $1')} value={v} />
                ))}
              </div>
            </Section>

            {/* Quantitative */}
            <Section icon={Activity} title="Quantitative Analysis">
              <div className="space-y-2">
                {result.quantitative?.map((q: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{q.metric}</span>
                        <span className="text-xs font-mono text-muted-foreground">{q.value}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{q.comment}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${gradeColor(q.grade)}`}>{q.grade}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Valuation */}
            <Section icon={DollarSign} title="Valuation Analysis">
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-xs">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 font-medium">Metric</th><th className="text-right py-2 font-medium">Current</th>
                    <th className="text-right py-2 font-medium">Historical</th><th className="text-right py-2 font-medium">Peers</th>
                  </tr></thead>
                  <tbody>{result.valuation?.multiples?.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 text-foreground font-medium">{m.metric}</td>
                      <td className="py-2 text-right font-mono text-foreground">{m.current}</td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{m.historical}</td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{m.peers}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <div className="text-[10px] uppercase text-muted-foreground">Fair Value</div>
                  <div className="text-base font-bold text-foreground font-mono">{result.valuation?.fairValue}</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] uppercase text-emerald-400/80">Upside</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">+{result.valuation?.upsidePct}%</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3 text-center">
                  <div className="text-[10px] uppercase text-red-400/80">Downside</div>
                  <div className="text-base font-bold text-red-400 font-mono">-{Math.abs(result.valuation?.downsidePct ?? 0)}%</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">DCF: {result.valuation?.dcfNote}</p>
            </Section>

            {/* Equity Research */}
            <Section icon={Brain} title="JP Morgan-Style Equity Research">
              <p className="text-sm text-foreground/90 mb-3">{result.equityResearch?.thesis}</p>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div><div className="font-semibold text-foreground mb-1">Competitive Advantages</div><ul className="space-y-1 text-muted-foreground">{result.equityResearch?.advantages?.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
                <div><div className="font-semibold text-foreground mb-1">Growth Drivers</div><ul className="space-y-1 text-muted-foreground">{result.equityResearch?.growthDrivers?.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
                <div><div className="font-semibold text-foreground mb-1">Market Opportunity</div><p className="text-muted-foreground">{result.equityResearch?.marketOpportunity}</p></div>
                <div><div className="font-semibold text-foreground mb-1">Risks</div><ul className="space-y-1 text-muted-foreground">{result.equityResearch?.risks?.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
                <div className="sm:col-span-2"><div className="font-semibold text-foreground mb-1">Management Assessment</div><p className="text-muted-foreground">{result.equityResearch?.management}</p></div>
              </div>
            </Section>

            {/* Hedge Fund View */}
            <Section icon={Target} title="Hedge Fund Analysis">
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {[
                  ['Asymmetric Upside', result.hedgeFundView?.asymmetricUpside],
                  ['Downside Protection', result.hedgeFundView?.downsideProtection],
                  ['Mispricing Thesis', result.hedgeFundView?.mispricing],
                  ['Compounder Potential', result.hedgeFundView?.compounderPotential],
                ].map(([k, v]: any) => (
                  <div key={k} className="bg-muted/40 rounded-lg p-3">
                    <div className="font-semibold text-foreground mb-1">{k}</div>
                    <p className="text-muted-foreground">{v}</p>
                  </div>
                ))}
                <div className="bg-muted/40 rounded-lg p-3"><div className="font-semibold text-foreground mb-1">Hidden Catalysts</div><ul className="text-muted-foreground space-y-1">{result.hedgeFundView?.hiddenCatalysts?.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
                <div className="bg-muted/40 rounded-lg p-3"><div className="font-semibold text-foreground mb-1">Short Seller Risks</div><ul className="text-muted-foreground space-y-1">{result.hedgeFundView?.shortRisks?.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
              </div>
            </Section>

            {/* Moat */}
            <Section icon={Shield} title={`Moat Analysis · ${result.moat?.overall}/10`}>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-3">
                {result.moat?.components && Object.entries(result.moat.components).map(([k, v]: any) => (
                  <ScoreBar key={k} label={k} value={v * 10} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">{result.moat?.summary}</p>
            </Section>

            {/* Sentiment + Risk + Fit */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Section icon={Activity} title="Market Sentiment">
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold border mb-3 ${verdictColor(result.sentiment?.verdict)}`}>{result.sentiment?.verdict}</span>
                <div className="text-xs space-y-2">
                  <div><span className="text-foreground font-medium">News:</span> <span className="text-muted-foreground">{result.sentiment?.news}</span></div>
                  <div><span className="text-foreground font-medium">Social:</span> <span className="text-muted-foreground">{result.sentiment?.social}</span></div>
                  <div><span className="text-foreground font-medium">Analysts:</span> <span className="text-muted-foreground">{result.sentiment?.analysts}</span></div>
                  <div><span className="text-foreground font-medium">Institutional:</span> <span className="text-muted-foreground">{result.sentiment?.institutional}</span></div>
                </div>
              </Section>
              <Section icon={AlertTriangle} title={`Risk Engine · ${result.risk?.score}/100`}>
                <div className="text-xs space-y-2">
                  {['financial', 'operational', 'regulatory', 'market', 'competitive'].map(k => (
                    <div key={k}><span className="text-foreground font-medium capitalize">{k}:</span> <span className="text-muted-foreground">{result.risk?.[k]}</span></div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Portfolio Fit */}
            <Section icon={Award} title="Portfolio Fit">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-bold">{result.portfolioFit?.classification}</span>
                <p className="text-xs text-muted-foreground flex-1">{result.portfolioFit?.rationale}</p>
              </div>
            </Section>

            {/* Price Targets */}
            <Section icon={Target} title="Price Target Engine">
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  ['Bear', result.priceTargets?.bear, 'red'],
                  ['Base', result.priceTargets?.base, 'yellow'],
                  ['Bull', result.priceTargets?.bull, 'emerald'],
                ].map(([label, t, c]: any) => (
                  <div key={label} className={`rounded-lg p-3 text-center bg-${c}-500/10 border border-${c}-500/30`}>
                    <div className={`text-[10px] uppercase text-${c}-400/80`}>{label} Case</div>
                    <div className={`text-base font-bold font-mono text-${c}-400`}>{t?.price}</div>
                    <div className="text-[10px] text-muted-foreground">{t?.probability}% prob.</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-center text-muted-foreground">Probability-weighted target: <span className="text-foreground font-mono font-bold">{result.priceTargets?.weighted}</span></div>
            </Section>

            {/* Final Decision */}
            <Section icon={Sparkles} title="Final Investment Decision">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <span className={`px-4 py-2 rounded-lg text-base font-bold border ${verdictColor(result.finalDecision?.verdict)}`}>{result.finalDecision?.verdict}</span>
                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${scoreColor(result.finalDecision?.confidencePct ?? 0)}`}>{result.finalDecision?.confidencePct}%</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Confidence</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-emerald-400 mb-2">Top 3 Reasons to Buy</div>
                  <ul className="space-y-1 text-xs text-foreground/90">{result.finalDecision?.reasonsToBuy?.map((r: string, i: number) => <li key={i}>{i + 1}. {r}</li>)}</ul>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-400 mb-2">Top 3 Reasons to Avoid</div>
                  <ul className="space-y-1 text-xs text-foreground/90">{result.finalDecision?.reasonsToAvoid?.map((r: string, i: number) => <li key={i}>{i + 1}. {r}</li>)}</ul>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="text-xs font-semibold text-primary mb-1">S&P 500 Outperformance (3-5Y)</div>
                <p className="text-xs text-foreground/90">{result.finalDecision?.outperformSP500}</p>
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
