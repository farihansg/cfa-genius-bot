import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are a top-tier venture capital partner combining the analytical rigor of YC, A16Z, Sequoia, and Draper. You evaluate pitch decks the way they would: ruthlessly honest, founder-friendly, specific.

You will receive a startup pitch deck (PDF). Read every slide carefully. Then return a JSON scorecard.

Score each category 0-100 based on what an A16Z/YC partner would think:
- problem: Is the problem painful, urgent, frequent? Who really has it?
- solution: Does the solution uniquely solve it? Is the "why now" clear?
- market: TAM/SAM/SOM credibility, market timing, bottom-up sizing.
- traction: Revenue, users, growth rate, retention, LOIs, design partners.
- business_model: Pricing, unit economics, CAC/LTV, path to monetization.
- team: Founder-market fit, prior wins, technical depth, completeness.
- competition: Honest competitive landscape, true differentiation, moat.
- gtm: Distribution strategy, repeatable channels, sales motion.
- product: Demo strength, defensibility, technology edge.
- ask: Clear raise amount, use of funds, milestones to next round.
- storytelling: Narrative arc, slide clarity, design, memorability.

Overall score is a weighted holistic judgment (NOT a simple average) reflecting fundability.

Verdict must be one of: "Pass", "Soft Pass", "Worth a Meeting", "Strong Interest", "Term Sheet Material".

Be specific. Reference actual slide content. No generic advice.`;

const SCHEMA = {
  name: 'pitch_scorecard',
  description: 'VC-grade pitch deck analysis',
  parameters: {
    type: 'object',
    properties: {
      deck_name: { type: 'string', description: 'Inferred company/deck name' },
      overall_score: { type: 'integer', minimum: 0, maximum: 100 },
      vc_verdict: { type: 'string' },
      summary: { type: 'string', description: '3-4 sentence executive summary as a VC would write it' },
      scores: {
        type: 'object',
        properties: {
          problem: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          solution: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          market: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          traction: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          business_model: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          team: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          competition: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          gtm: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          product: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          ask: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
          storytelling: { type: 'object', properties: { score: { type: 'integer' }, comment: { type: 'string' } }, required: ['score', 'comment'] },
        },
        required: ['problem','solution','market','traction','business_model','team','competition','gtm','product','ask','storytelling'],
      },
      strengths: { type: 'array', items: { type: 'string' }, description: '3-5 specific strengths' },
      weaknesses: { type: 'array', items: { type: 'string' }, description: '3-5 specific weaknesses' },
      improvements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            slide: { type: 'string' },
            tip: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['slide', 'tip', 'priority'],
        },
        description: '5-8 actionable improvements with priority',
      },
    },
    required: ['deck_name','overall_score','vc_verdict','summary','scores','strengths','weaknesses','improvements'],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { pdfBase64, fileName, sourceUrl } = await req.json();

    if (!pdfBase64 && !sourceUrl) {
      return new Response(JSON.stringify({ error: 'Provide pdfBase64 or sourceUrl' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userContent: any[] = [
      { type: 'text', text: `Analyze this pitch deck${fileName ? ` (file: ${fileName})` : ''}${sourceUrl ? ` (source: ${sourceUrl})` : ''}. Score it like a top-tier VC and return the structured scorecard.` },
    ];

    if (pdfBase64) {
      userContent.push({
        type: 'file',
        file: { filename: fileName || 'deck.pdf', file_data: `data:application/pdf;base64,${pdfBase64}` },
      });
    } else if (sourceUrl) {
      userContent.push({ type: 'text', text: `Fetch the deck from this URL and infer its contents: ${sourceUrl}. If you cannot access it directly, score based on the URL/context provided and note the limitation in the summary.` });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        tools: [{ type: 'function', function: SCHEMA }],
        tool_choice: { type: 'function', function: { name: 'pitch_scorecard' } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit hit. Please wait a moment and try again.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Add funds in Settings > Workspace > Usage.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No structured response from AI');

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('pitch-analyze error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
