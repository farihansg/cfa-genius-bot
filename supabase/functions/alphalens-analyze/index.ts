import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const SYSTEM_PROMPT = `You are AlphaLens, an institutional-grade buy-side equity analyst combining the rigor of a Bloomberg Terminal, JP Morgan equity research, and a top-tier hedge fund (Citadel/Point72/Tiger). Produce evidence-based, skeptical, capital-allocation-focused stock analysis using institutional investing language.

Rules:
- Think like a top-tier buy-side analyst. Prioritize facts, valuation, and risk-adjusted returns.
- Avoid generic explanations. Be specific with numbers, multiples, and recent catalysts.
- Be skeptical of management claims. Focus on capital allocation quality.
- Highlight contrarian opportunities and asymmetric setups.
- Explicitly assess whether the stock can outperform the S&P 500 over the next 3-5 years.
- Grade subcomponents A+/A/B/C/D/F. All scores 0-100 unless specified.
- Output STRICT JSON only — no markdown, no prose outside JSON.`;

const SCHEMA_INSTRUCTION = `Return ONLY valid JSON matching this exact shape:
{
  "ticker": string,
  "company": string,
  "horizon": string,
  "riskProfile": string,
  "executiveSummary": {
    "overview": string,
    "thesis": string,
    "bullCase": [string, string, string],
    "bearCase": [string, string, string],
    "catalysts": [string],
    "recommendation": "Strong Buy"|"Buy"|"Hold"|"Reduce"|"Sell"
  },
  "quantScore": {
    "overall": number,
    "rating": "Buy"|"Hold"|"Sell",
    "conviction": "Low"|"Medium"|"High",
    "components": {
      "financialHealth": number, "growth": number, "profitability": number,
      "valuation": number, "momentum": number, "sentiment": number, "moat": number
    }
  },
  "quantitative": [{"metric": string, "value": string, "grade": string, "comment": string}],
  "valuation": {
    "multiples": [{"metric": string, "current": string, "historical": string, "peers": string}],
    "fairValue": string, "upsidePct": number, "downsidePct": number, "dcfNote": string
  },
  "equityResearch": {
    "thesis": string, "advantages": [string], "marketOpportunity": string,
    "growthDrivers": [string], "risks": [string], "management": string
  },
  "hedgeFundView": {
    "asymmetricUpside": string, "downsideProtection": string, "hiddenCatalysts": [string],
    "mispricing": string, "shortRisks": [string], "compounderPotential": string
  },
  "moat": {
    "overall": number,
    "components": {"brand": number, "network": number, "switching": number, "data": number, "scale": number, "regulatory": number},
    "summary": string
  },
  "sentiment": {"verdict": "Bullish"|"Neutral"|"Bearish", "news": string, "social": string, "analysts": string, "institutional": string},
  "risk": {"score": number, "financial": string, "operational": string, "regulatory": string, "market": string, "competitive": string},
  "portfolioFit": {"classification": string, "rationale": string},
  "financials": {
    "annual": [{"year": string, "revenue": number, "grossMargin": number, "operatingMargin": number, "netMargin": number, "fcf": number, "roic": number, "epsGrowth": number}],
    "valuationHistory": [{"year": string, "pe": number, "evEbitda": number, "ps": number, "pfcf": number}],
    "unitNote": string
  },
  "priceTargets": {"bear": {"price": string, "probability": number}, "base": {"price": string, "probability": number}, "bull": {"price": string, "probability": number}, "weighted": string},
  "finalDecision": {
    "verdict": "Strong Buy"|"Buy"|"Hold"|"Reduce"|"Sell",
    "confidencePct": number,
    "reasonsToBuy": [string, string, string],
    "reasonsToAvoid": [string, string, string],
    "outperformSP500": string
  }
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { ticker, company, horizon = '1Y', riskProfile = 'Moderate' } = await req.json();
    if (!ticker) return new Response(JSON.stringify({ error: 'ticker required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const userPrompt = `Generate a full institutional equity research memo.

Ticker: ${ticker}
Company: ${company || '(infer from ticker)'}
Investment Horizon: ${horizon}
Risk Profile: ${riskProfile}

${SCHEMA_INSTRUCTION}`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: 'AI error', status: res.status, detail: text }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
