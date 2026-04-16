import { useState } from 'react';
import { Link2, CheckCircle2, ExternalLink, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Brokerage {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: 'connected' | 'available' | 'coming_soon';
  features: string[];
  color: string;
}

const BROKERAGES: Brokerage[] = [
  {
    id: 'alpaca',
    name: 'Alpaca',
    logo: '🦙',
    description: 'Commission-free API-first brokerage. Supports paper & live trading.',
    status: 'connected',
    features: ['Real-time trading', 'Portfolio sync', 'Market data', 'Paper trading'],
    color: 'hsl(var(--primary))',
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    logo: '🪶',
    description: 'Commission-free stocks, ETFs, options & crypto trading.',
    status: 'coming_soon',
    features: ['Portfolio import', 'Trade sync', 'Options data', 'Crypto'],
    color: '#00C805',
  },
  {
    id: 'webull',
    name: 'Webull',
    logo: '🐂',
    description: 'Advanced trading tools with extended-hours and global markets.',
    status: 'coming_soon',
    features: ['Portfolio import', 'Extended hours', 'Technical data', 'Options'],
    color: '#F5A623',
  },
  {
    id: 'wealthfront',
    name: 'Wealthfront',
    logo: '💎',
    description: 'Automated investing with tax-loss harvesting and financial planning.',
    status: 'coming_soon',
    features: ['Portfolio sync', 'Tax-loss harvesting', 'Auto-rebalance', 'Bonds'],
    color: '#6E56CF',
  },
  {
    id: 'schwab',
    name: 'Charles Schwab',
    logo: '🏦',
    description: 'Full-service brokerage with research and retirement accounts.',
    status: 'coming_soon',
    features: ['Portfolio import', 'Research data', 'Retirement accounts', 'Mutual funds'],
    color: '#00A0DF',
  },
  {
    id: 'fidelity',
    name: 'Fidelity',
    logo: '🏛️',
    description: 'Leading brokerage with zero-fee index funds and retirement planning.',
    status: 'coming_soon',
    features: ['Portfolio import', 'Index funds', 'Retirement', '401k sync'],
    color: '#4A8C2A',
  },
];

const BrokerageConnections = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleConnect = (brokerage: Brokerage) => {
    if (brokerage.status === 'connected') {
      toast.info(`${brokerage.name} is already connected.`);
      return;
    }
    if (brokerage.status === 'coming_soon') {
      toast.info(`${brokerage.name} integration coming soon! We'll notify you when it's available.`);
      return;
    }
  };

  const handleRequestAccess = (name: string) => {
    toast.success(`You'll be notified when ${name} integration is available!`);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" /> Connected Brokerages
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Connect your investment accounts to analyze portfolios and execute trades via AI.
      </p>

      <div className="space-y-3">
        {BROKERAGES.map((b) => (
          <div
            key={b.id}
            className={`rounded-xl border transition-all ${
              b.status === 'connected'
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-background hover:border-muted-foreground/20'
            }`}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
            >
              <span className="text-2xl">{b.logo}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{b.name}</span>
                  {b.status === 'connected' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gain/10 text-gain text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  )}
                  {b.status === 'coming_soon' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{b.description}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnect(b);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  b.status === 'connected'
                    ? 'bg-gain/10 text-gain cursor-default'
                    : b.status === 'available'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {b.status === 'connected' ? 'Active' : b.status === 'available' ? 'Connect' : 'Notify Me'}
              </button>
            </div>

            {expandedId === b.id && (
              <div className="px-4 pb-3 pt-0">
                <div className="border-t border-border pt-3 mt-1">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {b.features.map((f) => (
                      <span key={f} className="px-2 py-1 rounded-md bg-muted text-[10px] text-muted-foreground font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                  {b.status === 'connected' ? (
                    <div className="flex items-center gap-2 text-xs text-gain">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Securely connected via encrypted API keys</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>OAuth integration in development</span>
                      </div>
                      <button
                        onClick={() => handleRequestAccess(b.name)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Request early access <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">🔐 Security:</strong> All brokerage connections use
          encrypted API keys stored server-side. InveStarAnalyst never stores your brokerage
          passwords. Alpaca uses paper trading mode by default for safety.
        </p>
      </div>
    </div>
  );
};

export default BrokerageConnections;
