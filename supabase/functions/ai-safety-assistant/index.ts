import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * AI Safety Assistant — RAG-powered
 * 
 * Flow:
 * 1. Receive messages from frontend
 * 2. Extract city mention from the latest user message
 * 3. Query Supabase for: city_safety scores, safety_tips, top guide reviews for that city
 * 4. Build a context block with real data
 * 5. Inject context into system prompt before calling Claude
 * 6. Return grounded, data-backed answer
 */

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cities we have data for — used for fuzzy matching in the query
const KNOWN_CITIES = [
  "Bangalore","Bengaluru","Mumbai","Bombay","Delhi","New Delhi","Goa",
  "Jaipur","Hyderabad","Chennai","Madras","Kochi","Cochin","Varanasi","Banaras",
  "Kolkata","Calcutta","Pune","Ahmedabad","Udaipur","Rishikesh","Shimla","Manali",
  "Darjeeling","Mysore","Mysuru","Agra","Amritsar","Chandigarh"
];

// Aliases → canonical city name in DB
const CITY_ALIASES: Record<string, string> = {
  "bengaluru": "Bangalore","bombay": "Mumbai","new delhi": "Delhi",
  "cochin": "Kochi","banaras": "Varanasi","calcutta": "Kolkata","madras": "Chennai",
  "mysuru": "Mysore",
};

function extractCity(text: string): string | null {
  const lower = text.toLowerCase();
  // Check aliases first
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  // Check known cities
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return null;
}

async function fetchCityContext(city: string): Promise<string> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const cityLower = city.toLowerCase();

  // 1. Safety scores
  const { data: safetyData } = await db
    .from("city_safety")
    .select("*")
    .ilike("city", cityLower)
    .maybeSingle();

  // 2. Safety tips for this city
  const { data: tipsData } = await db
    .from("safety_tips")
    .select("category, tip, severity")
    .ilike("city", cityLower)
    .order("severity", { ascending: false })
    .limit(10);

  // 3. Guide reviews for this city (recent, with comments)
  const { data: reviewsData } = await db
    .from("guide_reviews")
    .select("rating, comment, city, created_at")
    .ilike("city", cityLower)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  // 4. Active guides in this city
  const { data: guidesData } = await db
    .from("guide_profiles")
    .select("city, rating, reviews_count, specialties")
    .ilike("city", cityLower)
    .eq("status", "active")
    .eq("kyc_status", "verified")
    .limit(5);

  let context = `\n\n## Real-time SafeShe Data for ${city}\n`;

  if (safetyData) {
    context += `\n### Safety Scores (out of 10)
- Overall safety: ${safetyData.overall_score}/10
- Night safety: ${safetyData.night_score}/10
- Public transport: ${safetyData.transport_score}/10
- Solo traveller experience: ${safetyData.solo_traveller_score}/10
- Community summary: ${safetyData.summary}\n`;
  } else {
    context += `\n(No safety score data available for ${city} in our database yet.)\n`;
  }

  if (tipsData && tipsData.length > 0) {
    context += `\n### Community Safety Tips\n`;
    const byCategory: Record<string, typeof tipsData> = {};
    for (const tip of tipsData) {
      if (!byCategory[tip.category]) byCategory[tip.category] = [];
      byCategory[tip.category].push(tip);
    }
    for (const [cat, tips] of Object.entries(byCategory)) {
      context += `\n**${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n`;
      for (const t of tips) {
        const icon = t.severity === "warning" ? "⚠️" : t.severity === "caution" ? "🔶" : "ℹ️";
        context += `- ${icon} ${t.tip}\n`;
      }
    }
  }

  if (reviewsData && reviewsData.length > 0) {
    context += `\n### Recent Traveller Reviews\n`;
    for (const r of reviewsData) {
      context += `- ⭐ ${r.rating}/5: "${r.comment}"\n`;
    }
  }

  if (guidesData && guidesData.length > 0) {
    context += `\n### Available Verified SafeShe Guides in ${city}\n`;
    context += `(${guidesData.length} Aadhaar-verified women guides available — users can book them on SafeShe)\n`;
    for (const g of guidesData) {
      context += `- ⭐ ${g.rating?.toFixed(1) || "New"} · Specialties: ${g.specialties?.join(", ") || "General"}\n`;
    }
  }

  return context;
}

const BASE_SYSTEM_PROMPT = `You are SafeShe AI — a warm, knowledgeable travel safety assistant for women travelling in India and worldwide. You are powered by real community data from the SafeShe platform including verified safety scores, community-submitted tips, and reviews from real women travellers.

## Your role
- Answer women's safety questions honestly, practically, and without being alarmist
- Use the real SafeShe data provided in the context block (if available) as your PRIMARY source
- Give specific, actionable advice (real area names, real apps, real strategies)
- When quoting safety scores, always cite them as "according to SafeShe community data"
- Highlight safe zones, women-only facilities, trusted guides, and red flags
- End with an empowering, confidence-building note

## Data priority
1. FIRST: Use data from "## Real-time SafeShe Data" block (real platform data)
2. THEN: Supplement with your own knowledge for gaps
3. NEVER contradict the real data scores — they come from verified community sources

## Format
- Use short paragraphs, not dense walls of text
- Use emoji sparingly but purposefully (⭐ for ratings, ⚠️ for warnings, ✅ for safe zones)
- For safety scores, present them clearly: e.g. "Night safety: 6.5/10 — manageable with precautions"
- If SafeShe has verified guides in the city, always mention they can be booked on the platform

## Tone
Warm and direct — like a well-travelled friend. Not corporate, not preachy. Honest about risks without creating unnecessary fear.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set in Edge Function secrets." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract city from the latest user message
    const latestUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const mentionedCity = latestUserMsg ? extractCity(latestUserMsg.content) : null;

    // Fetch real context from DB
    let ragContext = "";
    if (mentionedCity) {
      try {
        ragContext = await fetchCityContext(mentionedCity);
      } catch (e) {
        console.error("RAG fetch error:", e);
        // Non-fatal — AI will still answer from its own knowledge
      }
    }

    // Build final system prompt with injected context
    const systemPrompt = BASE_SYSTEM_PROMPT + (ragContext
      ? `\n\n---\n${ragContext}\n---\nUse the above real SafeShe data to ground your answer.`
      : "\n\nNo specific city data found in SafeShe database for this query. Answer from general knowledge and recommend the user search that city on SafeShe for detailed scores.");

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error("Anthropic error:", err);
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const reply = data.content?.[0]?.text ?? "Sorry, no response received.";
    const usedCity = mentionedCity ?? null;

    return new Response(JSON.stringify({ reply, city: usedCity, hadRagData: !!ragContext }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
