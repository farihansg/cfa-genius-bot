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

    const { symbol, notional, type, limitPrice, aiRationale } = await req.json();

    if (!symbol || !notional || notional < 1) {
      return new Response(JSON.stringify({ success: false, message: "Invalid order parameters." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Check max position size
    const { data: settings } = await supabase.from("settings").select("max_position_pct").eq("id", user.id).single();
    const maxPct = settings?.max_position_pct || 15;

    const accRes = await fetch(`${ALPACA_BASE}/v2/account`, { headers: alpacaHeaders });
    const account = await accRes.json();
    const totalValue = Number(account.portfolio_value);
    const maxAllowed = totalValue * (maxPct / 100);

    // Check existing position
    const posRes = await fetch(`${ALPACA_BASE}/v2/positions`, { headers: alpacaHeaders });
    const positions = await posRes.json();
    const existing = Array.isArray(positions) ? positions.find((p: any) => p.symbol === symbol.toUpperCase()) : null;
    const existingValue = existing ? Number(existing.market_value) : 0;

    if (existingValue + notional > maxAllowed) {
      return new Response(JSON.stringify({
        success: false,
        message: `Position would exceed ${maxPct}% limit ($${maxAllowed.toFixed(0)} max). Current: $${existingValue.toFixed(0)}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Place BUY order
    const body: Record<string, unknown> = {
      symbol: symbol.toUpperCase(),
      side: "buy",
      type: type || "market",
      time_in_force: "day",
      notional: notional.toFixed(2),
    };
    if (type === "limit" && limitPrice) {
      body.limit_price = limitPrice.toFixed(2);
    }

    const orderRes = await fetch(`${ALPACA_BASE}/v2/orders`, {
      method: "POST",
      headers: alpacaHeaders,
      body: JSON.stringify(body),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ success: false, message: err.message || "Order failed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await orderRes.json();

    // Log trade
    await supabase.from("trade_log").insert({
      user_id: user.id,
      alpaca_order_id: order.id,
      symbol: symbol.toUpperCase(),
      side: "buy",
      order_type: type || "market",
      notional,
      status: order.status,
      ai_rationale: aiRationale || null,
    });

    return new Response(JSON.stringify({
      success: true,
      message: `✅ BUY $${notional} of ${symbol.toUpperCase()} — ${order.status}`,
      orderId: order.id,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("Invest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
