import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
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

    const ALPACA_BASE = Deno.env.get("ALPACA_BASE_URL") || "https://paper-api.alpaca.markets";
    const ALPACA_KEY = Deno.env.get("ALPACA_API_KEY");
    const ALPACA_SECRET = Deno.env.get("ALPACA_API_SECRET");

    if (!ALPACA_KEY || !ALPACA_SECRET) {
      return new Response(JSON.stringify({ error: "Alpaca API keys not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alpacaHeaders = {
      "APCA-API-KEY-ID": ALPACA_KEY,
      "APCA-API-SECRET-KEY": ALPACA_SECRET,
      "Content-Type": "application/json",
    };

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "account";

    if (action === "account") {
      const res = await fetch(`${ALPACA_BASE}/v2/account`, { headers: alpacaHeaders });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "positions") {
      const res = await fetch(`${ALPACA_BASE}/v2/positions`, { headers: alpacaHeaders });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "orders") {
      const res = await fetch(`${ALPACA_BASE}/v2/orders?limit=20&direction=desc`, { headers: alpacaHeaders });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "quote") {
      const symbol = url.searchParams.get("symbol");
      if (!symbol) {
        return new Response(JSON.stringify({ error: "symbol required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(
        `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`,
        { headers: alpacaHeaders }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bars") {
      const symbol = url.searchParams.get("symbol");
      const timeframe = url.searchParams.get("timeframe") || "1Day";
      const limit = url.searchParams.get("limit") || "30";
      if (!symbol) {
        return new Response(JSON.stringify({ error: "symbol required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetch(
        `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`,
        { headers: alpacaHeaders }
      );
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Portfolio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
