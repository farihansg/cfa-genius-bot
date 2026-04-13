-- Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Settings
CREATE TABLE public.settings (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  investing_style TEXT DEFAULT 'growth',
  risk_level TEXT DEFAULT 'moderate-high',
  time_horizon TEXT DEFAULT '10+ years',
  stock_target_pct INT DEFAULT 65,
  reit_target_pct INT DEFAULT 25,
  bond_target_pct INT DEFAULT 10,
  max_position_pct INT DEFAULT 15,
  rebalance_frequency TEXT DEFAULT 'quarterly',
  auto_invest_enabled BOOL DEFAULT true,
  dca_amount_usd INT DEFAULT 500,
  dca_frequency TEXT DEFAULT 'monthly',
  buy_on_dip BOOL DEFAULT true,
  notify_before_invest BOOL DEFAULT true,
  esg_filter BOOL DEFAULT false,
  dividend_focus BOOL DEFAULT false,
  sell_orders_allowed BOOL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own settings" ON public.settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own settings" ON public.settings FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = id);

-- Trade log
CREATE TABLE public.trade_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  alpaca_order_id TEXT,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'buy',
  order_type TEXT,
  notional NUMERIC,
  qty NUMERIC,
  status TEXT,
  filled_avg_price NUMERIC,
  ai_rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trade_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own trades" ON public.trade_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own trades" ON public.trade_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat history
CREATE TABLE public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own chat" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chat" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (new.id, new.email);
  INSERT INTO public.settings (id) VALUES (new.id);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();