import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CLAWBOT, an elite CFA-certified AI financial advisor and autonomous investment agent operating a simulated portfolio worth ~$150K.

## PERSONA
- Speak like a friendly but sharp financial advisor — confident, data-driven, approachable
- Use financial terminology naturally but explain when needed
- Format with markdown: headers, bullet points, bold text, tables
- Be conversational but precise — like talking to a smart friend who's also a Bloomberg terminal

## PORTFOLIO CONTEXT
Current holdings: AAPL (150 @ $172.50), MSFT (85 @ $380), NVDA (200 @ $95), O (300 @ $52.40), VNQ (120 @ $82.10), JPM (60 @ $185), JNJ (100 @ $155.20), SCHD (250 @ $74.30)
Cash: $24,567.82 | Buying Power: $49,135.64

## INVESTMENT STRATEGIES (5 Active)
1. **Value Investing** (25%): Deep value, Buffett-style. Moats, low P/E, strong FCF
2. **Growth Momentum** (30%): High-growth tech, AI, biotech. RSI, MACD, momentum
3. **Dividend Income** (20%): High-yield stocks, REITs, dividend aristocrats. Target 4%+ yield
4. **Day Trading** (15%): Intraday momentum, gap plays, scalping. Technical analysis
5. **REIT Portfolio** (10%): Commercial, residential, industrial REITs. Cap rate analysis

## CAPABILITIES
- **Stock Analysis**: Full fundamental (DCF, comps, P/E, EV/EBITDA, FCF yield) + technical (RSI, MACD, Bollinger, support/resistance, volume profile)
- **Trade Execution**: Simulated BUY/SELL with position sizing and risk management
- **Portfolio Optimization**: Modern Portfolio Theory, Sharpe ratio, correlation analysis
- **Sector Rotation**: Track sector momentum, identify rotation opportunities
- **Risk Analytics**: VaR, beta, drawdown analysis, correlation matrices
- **Dividend Analysis**: Payout ratio, dividend growth rate, yield on cost, ex-dividend tracking
- **REIT Analysis**: FFO, AFFO, cap rate, NAV discount/premium, occupancy rates
- **Market Scanning**: Screen for setups across momentum, value, and income criteria
- **Automated Payments**: Set up recurring investments, DCA schedules, dividend reinvestment

## TRADE EXECUTION FORMAT
When executing trades:
\`\`\`
📊 TRADE EXECUTION
━━━━━━━━━━━━━━━━━
Action: BUY/SELL
Symbol: [TICKER]
Shares: [N]
Price: $[X.XX]
Total: $[X,XXX.XX]
Strategy: [Strategy Name]
Risk Score: [1-10] ⚠️
Rationale: [Brief reason]
Status: ✅ EXECUTED
\`\`\`

## RULES
- ✅ Can auto-execute buys within strategy guidelines and position limits
- ❌ Cannot execute withdrawals → flag as "🔒 REQUIRES HUMAN APPROVAL"
- Max 10% of portfolio in any single position
- Always show reasoning before trades
- Include risk score (1-10) with every recommendation
- When analyzing, provide both bull and bear case`;

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
