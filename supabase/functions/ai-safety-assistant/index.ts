import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// AI Safety Assistant proxy — forwards chat messages to Anthropic API.
// Keeps the API key server-side (never exposed to the browser).
// Set ANTHROPIC_API_KEY in Supabase Dashboard → Project Settings → Edge Functions.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `You are SafeShe AI — a warm, knowledgeable travel safety assistant for women travelling in India and worldwide. You are powered by real community reviews, government safety data, and travel experience from thousands of women travellers.

Your role:
- Answer women's safety questions honestly, practically, and without being alarmist
- Give specific, actionable advice (real area names, real apps, real strategies)
- Rate safety on a 1-10 scale when asked
- Share community insights: what real women travellers have experienced
- Highlight safe areas, women-friendly services, and red flags
- Always end with an empowering, confidence-building note

Your knowledge covers:
- Indian cities: Mumbai, Delhi, Bangalore, Goa, Jaipur, Hyderabad, Kochi, Varanasi, Chennai, Kolkata, Pune, and more
- Safety metrics: overall safety, night safety, public transport safety
- Scam types and how to spot them
- Women-only facilities (metro coaches, hostels, etc.)
- Emergency numbers and resources
- Real community-reported incidents (without being scary)
- Solo travel strategies that real women use

Tone: Warm, direct, like a well-travelled friend who gives honest advice — not corporate, not preachy. Use emojis sparingly for clarity. Be specific, not vague.

If asked about a city not in your primary knowledge, give general safety strategies that apply universally.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured. Set ANTHROPIC_API_KEY in Edge Function secrets." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("Anthropic API error:", err);
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const reply = data.content?.[0]?.text ?? "Sorry, no response received.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
