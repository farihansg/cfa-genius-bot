import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, Save, Shield, Sliders, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    investing_style: 'growth',
    risk_level: 'moderate-high',
    time_horizon: '10+ years',
    stock_target_pct: 65,
    reit_target_pct: 25,
    bond_target_pct: 10,
    max_position_pct: 15,
    rebalance_frequency: 'quarterly',
    auto_invest_enabled: true,
    dca_amount_usd: 500,
    dca_frequency: 'monthly',
    buy_on_dip: true,
    notify_before_invest: true,
    esg_filter: false,
    dividend_focus: false,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('settings').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setSettings(s => ({ ...s, ...data }));
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('settings').update({
      ...settings,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    setSaving(false);
    if (error) toast.error('Failed to save settings');
    else toast.success('Settings saved');
  }

  const update = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground">InveStarAnalyst</span>
        </div>
        <div className="ml-auto">
          <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-40 flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Investment Profile */}
        <Section icon={Target} title="Investment Profile">
          <SelectField label="Investing Style" value={settings.investing_style}
            onChange={v => update('investing_style', v)}
            options={['growth', 'value', 'income', 'balanced', 'aggressive']} />
          <SelectField label="Risk Level" value={settings.risk_level}
            onChange={v => update('risk_level', v)}
            options={['conservative', 'moderate', 'moderate-high', 'aggressive']} />
          <SelectField label="Time Horizon" value={settings.time_horizon}
            onChange={v => update('time_horizon', v)}
            options={['1-3 years', '3-5 years', '5-10 years', '10+ years']} />
        </Section>

        {/* Allocation */}
        <Section icon={Sliders} title="Target Allocation">
          <RangeField label="Stocks" value={settings.stock_target_pct} onChange={v => update('stock_target_pct', v)} />
          <RangeField label="Real Estate (REITs)" value={settings.reit_target_pct} onChange={v => update('reit_target_pct', v)} />
          <RangeField label="Bonds / Cash" value={settings.bond_target_pct} onChange={v => update('bond_target_pct', v)} />
          <RangeField label="Max Single Position" value={settings.max_position_pct} onChange={v => update('max_position_pct', v)} max={30} />
        </Section>

        {/* Auto-invest */}
        <Section icon={Zap} title="Automation">
          <ToggleField label="Auto-invest enabled" checked={settings.auto_invest_enabled} onChange={v => update('auto_invest_enabled', v)} />
          <NumberField label="DCA Amount (USD)" value={settings.dca_amount_usd} onChange={v => update('dca_amount_usd', v)} />
          <SelectField label="DCA Frequency" value={settings.dca_frequency}
            onChange={v => update('dca_frequency', v)}
            options={['weekly', 'biweekly', 'monthly']} />
          <ToggleField label="Buy on dip (auto-trigger)" checked={settings.buy_on_dip} onChange={v => update('buy_on_dip', v)} />
          <ToggleField label="Notify before investing" checked={settings.notify_before_invest} onChange={v => update('notify_before_invest', v)} />
          <SelectField label="Rebalance Frequency" value={settings.rebalance_frequency}
            onChange={v => update('rebalance_frequency', v)}
            options={['monthly', 'quarterly', 'semi-annual', 'annual']} />
        </Section>

        {/* Filters */}
        <Section icon={Shield} title="Filters & Preferences">
          <ToggleField label="ESG-only filter" checked={settings.esg_filter} onChange={v => update('esg_filter', v)} />
          <ToggleField label="Dividend focus" checked={settings.dividend_focus} onChange={v => update('dividend_focus', v)} />
        </Section>

        {/* Alpaca API info */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning" /> Alpaca Connection
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Alpaca API keys are configured securely on the backend. To update your Alpaca credentials, contact your admin or update the secrets in the backend settings. 
            Your account uses <strong className="text-foreground">paper trading</strong> mode by default for safety.
          </p>
        </div>
      </div>
    </div>
  );
};

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-muted-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground capitalize">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-muted-foreground">{label}</label>
      <button onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  );
}

function RangeField({ label, value, onChange, max = 100 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-muted-foreground">{label}</label>
        <span className="text-sm font-medium text-foreground">{value}%</span>
      </div>
      <input type="range" min={0} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary" />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-24 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-right" />
    </div>
  );
}

export default SettingsPage;
