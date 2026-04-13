import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch live portfolio context if Alpaca is configured
    let portfolioContext = "Portfolio data: Using simulated portfolio (Alpaca not connected).";
    const ALPACA_KEY = Deno.env.get("ALPACA_API_KEY");
    const ALPACA_SECRET = Deno.env.get("ALPACA_API_SECRET");
    const ALPACA_BASE = Deno.env.get("ALPACA_BASE_URL") || "https://paper-api.alpaca.markets";

    if (ALPACA_KEY && ALPACA_SECRET) {
      try {
        const alpacaHeaders = {
          "APCA-API-KEY-ID": ALPACA_KEY,
          "APCA-API-SECRET-KEY": ALPACA_SECRET,
        };
        const [accRes, posRes] = await Promise.all([
          fetch(`${ALPACA_BASE}/v2/account`, { headers: alpacaHeaders }),
          fetch(`${ALPACA_BASE}/v2/positions`, { headers: alpacaHeaders }),
        ]);
        const account = await accRes.json();
        const positions = await posRes.json();
        const posLines = Array.isArray(positions)
          ? positions.map((p: any) =>
              `  - ${p.symbol}: $${Number(p.market_value).toFixed(2)} (${(Number(p.unrealized_plpc)*100).toFixed(1)}% P&L, qty ${p.qty})`
            ).join("\n")
          : "  No positions.";
        portfolioContext = `
LIVE PORTFOLIO (Alpaca):
- Equity: $${Number(account.equity).toFixed(2)}
- Cash: $${Number(account.cash).toFixed(2)}
- Portfolio value: $${Number(account.portfolio_value).toFixed(2)}
- Unrealized P&L: $${Number(account.unrealized_pl).toFixed(2)}

Positions:
${posLines}`;
      } catch {
        portfolioContext = "Portfolio data temporarily unavailable.";
      }
    }

    // Fetch user settings
    const { data: settings } = await supabase.from("settings").select("*").eq("id", user.id).single();

    const systemPrompt = `You are InveStarAnalyst, an elite AI investment advisor with CFA charterholder-level expertise. You combine:
- Institutional equity research (DCF, comparable analysis, factor investing)
- Real estate investment analysis (cap rates, NOI, REITs, direct property)
- Crypto analysis (on-chain metrics, tokenomics, DeFi yield)
- Portfolio construction (MPT, efficient frontier, risk-adjusted returns)
- Macro awareness (Fed policy, rates, sector rotation)
- Technical analysis (RSI, MACD, Bollinger Bands, volume profile, support/resistance)
- Behavioral finance (avoiding bias, DCA discipline)

${portfolioContext}

USER PROFILE:
- Investing style: ${settings?.investing_style || "growth"}
- Risk tolerance: ${settings?.risk_level || "moderate-high"}
- Time horizon: ${settings?.time_horizon || "10+ years"}
- Target: ${settings?.stock_target_pct || 65}% stocks, ${settings?.reit_target_pct || 25}% RE, ${settings?.bond_target_pct || 10}% bonds
- Max single position: ${settings?.max_position_pct || 15}%
- ESG filter: ${settings?.esg_filter ? "yes" : "no"} | Dividend focus: ${settings?.dividend_focus ? "yes" : "no"}

CAPABILITIES:
- Analyze any stock, ETF, REIT, or crypto with fundamental + technical analysis
- Execute BUY orders through Alpaca (use format: **[TRADE] BUY $X of SYMBOL**)
- Portfolio optimization and rebalancing recommendations
- Sector rotation and momentum scanning
- Risk analytics (VaR, beta, Sharpe, drawdown)
- Dividend yield analysis and ex-dividend tracking
- REIT analysis (FFO, AFFO, cap rate, NAV)

RULES:
1. ONLY recommend/execute BUY orders. NEVER assist with withdrawals or full liquidation — flag as "🔒 REQUIRES HUMAN APPROVAL"
2. Respect max position size limit
3. Use real metrics (P/E, yields, Sharpe ratios, cap rates) when relevant
4. Format with markdown: headers, bold, bullets, tables, code blocks
5. Include risk score (1-10) with every trade recommendation
6. Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

When executing trades, format as:
\`\`\`
📊 TRADE EXECUTION
━━━━━━━━━━━━━━━━━
Action: BUY
Symbol: [TICKER]
Amount: $[X,XXX.XX]
Type: Market/Limit
Strategy: [Strategy Name]
Risk Score: [1-10]
Rationale: [Brief reason]
Status: ✅ EXECUTED / ⏳ PENDING APPROVAL
\`\`\``;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save last user message to chat history
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg) {
      await supabase.from("chat_history").insert({
        user_id: user.id,
        role: "user",
        content: lastUserMsg.content,
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
