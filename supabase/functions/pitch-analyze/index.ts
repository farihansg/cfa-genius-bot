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

async function bufferToBase64(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchUrlAsPdfBase64(url: string, fileName: string): Promise<{ pdfBase64?: string; fileName?: string; note?: string }> {
  const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 PitchScan' } });
  if (!res.ok) return { note: `URL returned ${res.status}. May be private.` };
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('pdf')) {
    return { note: `URL did not return a PDF (got ${ctype || 'unknown type'}). Analyzing from URL context only.` };
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 20 * 1024 * 1024) return { note: 'Fetched deck exceeds 20MB. Analyzing from URL context only.' };
  return { pdfBase64: await bufferToBase64(buf), fileName };
}

async function fetchDeckFromUrl(rawUrl: string): Promise<{ pdfBase64?: string; fileName?: string; note?: string }> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return { note: 'Invalid URL.' }; }

  const host = url.hostname.toLowerCase();

  // Google Slides — export as PDF
  const slidesMatch = url.pathname.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (host.includes('docs.google.com') && slidesMatch) {
    const id = slidesMatch[1];
    const exportUrl = `https://docs.google.com/presentation/d/${id}/export/pdf`;
    return fetchUrlAsPdfBase64(exportUrl, `slides-${id}.pdf`);
  }

  // Google Drive file — try export
  const driveMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (host.includes('drive.google.com') && driveMatch) {
    const id = driveMatch[1];
    const exportUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    return fetchUrlAsPdfBase64(exportUrl, `drive-${id}.pdf`);
  }

  // Direct PDF or any URL — attempt fetch
  return fetchUrlAsPdfBase64(rawUrl, rawUrl.split('/').pop()?.split('?')[0] || 'deck.pdf');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    let { pdfBase64, fileName, sourceUrl } = await req.json();

    if (!pdfBase64 && !sourceUrl) {
      return new Response(JSON.stringify({ error: 'Provide pdfBase64 or sourceUrl' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let resolvedFileName = fileName;
    let fetchNote: string | null = null;

    // If URL provided and no PDF yet, try to fetch deck content
    if (!pdfBase64 && sourceUrl) {
      try {
        const fetched = await fetchDeckFromUrl(sourceUrl);
        if (fetched.pdfBase64) {
          pdfBase64 = fetched.pdfBase64;
          resolvedFileName = fetched.fileName || 'deck.pdf';
        } else if (fetched.note) {
          fetchNote = fetched.note;
        }
      } catch (e) {
        console.error('URL fetch failed:', e);
        fetchNote = `Could not auto-fetch the deck (${e instanceof Error ? e.message : 'unknown error'}). The link may be private or require sign-in.`;
      }
    }

    const userContent: any[] = [
      { type: 'text', text: `Analyze this pitch deck${resolvedFileName ? ` (file: ${resolvedFileName})` : ''}${sourceUrl ? ` (source: ${sourceUrl})` : ''}. Score it like a top-tier VC and return the structured scorecard.` },
    ];

    if (pdfBase64) {
      userContent.push({
        type: 'file',
        file: { filename: resolvedFileName || 'deck.pdf', file_data: `data:application/pdf;base64,${pdfBase64}` },
      });
    } else if (sourceUrl) {
      userContent.push({ type: 'text', text: `${fetchNote ? fetchNote + ' ' : ''}Attempt to infer contents from this URL: ${sourceUrl}. If you cannot access it, note the limitation explicitly in the summary and lower confidence scores accordingly.` });
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
