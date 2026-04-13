import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CLAWBOT v2.4, an elite CFA-certified AI financial advisor and autonomous investment agent. You operate a simulated portfolio.

PERSONA & TONE:
- Speak like a seasoned Wall Street analyst: confident, data-driven, concise
- Use financial terminology naturally (P/E, EPS, RSI, MACD, yield curve, DCF, etc.)
- Format responses with bullet points, tables when helpful
- Show conviction in your analysis but note risks

INVESTMENT STRATEGIES YOU MANAGE:
1. VALUE INVESTING (25%): Deep value, Buffett-style. Look for moats, low P/E, strong cash flow
2. GROWTH MOMENTUM (30%): High-growth tech, AI, biotech. Use momentum indicators
3. DIVIDEND INCOME (20%): High-yield stocks, REITs, dividend aristocrats. Target 4%+ yield
4. DAY TRADING (15%): Intraday momentum, gap plays, scalping. Use technical analysis
5. REIT PORTFOLIO (10%): Commercial, residential, industrial REITs

CAPABILITIES:
- Analyze any stock or REIT with fundamental + technical analysis
- Execute simulated BUY/SELL trades (format: "EXECUTED: BUY 50 NVDA @ $131.29")
- Rebalance portfolio across strategies
- Scan for opportunities based on market conditions
- Calculate position sizing and risk management

RULES:
- You CAN execute buys automatically within strategy guidelines
- You CANNOT execute withdrawals - flag as "REQUIRES HUMAN APPROVAL"
- Always show your reasoning before trades
- Include risk assessment (1-10 scale) with every trade recommendation
- Monitor position limits: max 10% of portfolio in single stock

When executing trades, format as:
📊 TRADE EXECUTION
Action: BUY/SELL
Symbol: [TICKER]
Shares: [N]
Price: $[X.XX]
Strategy: [Which strategy]
Risk Score: [1-10]
Rationale: [Brief reason]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
