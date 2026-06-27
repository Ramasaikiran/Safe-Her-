import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * AI Safety Assistant — true RAG pipeline
 *
 * Flow:
 *  1. Embed the user query using gte-small (free, runs in edge runtime)
 *  2. pgvector similarity search across safety_tips, city_safety, guide_reviews
 *  3. Build a grounded context block from top K results
 *  4. Send context + conversation to Groq (free Llama 3.1)
 *  5. Return answer
 *
 * Cost: $0 — Supabase gte-small is free, Groq free tier = 6000 req/day
 *
 * Required secrets:
 *   GROQ_API_KEY — get free key at console.groq.com
 */

const GROQ_API_KEY  = Deno.env.get("GROQ_API_KEY");
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GROQ_MODEL = "llama-3.1-8b-instant"; // free, fast, good quality

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KNOWN_CITIES = [
  "Bangalore","Bengaluru","Mumbai","Bombay","Delhi","New Delhi","Goa",
  "Jaipur","Hyderabad","Chennai","Madras","Kochi","Cochin","Varanasi",
  "Kolkata","Calcutta","Pune","Ahmedabad","Udaipur","Rishikesh","Shimla",
  "Manali","Darjeeling","Mysore","Mysuru","Agra","Amritsar","Chandigarh",
];

const CITY_ALIASES: Record<string, string> = {
  "bengaluru": "Bangalore", "bombay": "Mumbai", "new delhi": "Delhi",
  "cochin": "Kochi", "banaras": "Varanasi", "calcutta": "Kolkata",
  "madras": "Chennai", "mysuru": "Mysore",
};

function extractCity(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return null;
}

const SYSTEM_PROMPT = `You are SafeShe AI — a warm, practical travel safety assistant for women travelling in India. You answer based on real community data retrieved from the SafeShe platform.

Rules:
- Use the CONTEXT block below as your PRIMARY source of truth
- Cite scores accurately: "SafeShe community data rates Bangalore night safety at 6.5/10"
- Be specific — name real areas, real apps, real strategies
- Be honest about risks without creating unnecessary fear
- End every response with one empowering sentence
- Keep responses concise and scannable (short paragraphs, use bullet points for tips)
- If the context has verified guides, mention they can be booked on SafeShe

Tone: Like a well-travelled friend — warm, direct, not corporate.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({
      error: "GROQ_API_KEY not set. Get a free key at console.groq.com and run: supabase secrets set GROQ_API_KEY=your-key"
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { messages } = await req.json();
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const latestUser = [...messages].reverse().find((m: any) => m.role === "user");
    const userQuery = latestUser?.content ?? "";
    const mentionedCity = extractCity(userQuery);

    // ── Step 1: Embed user query (free, in-runtime) ──────────────
    // @ts-ignore — Supabase edge runtime global
    const session = new Supabase.ai.Session("gte-small");
    const queryEmbedding = await session.run(userQuery, { mean_pool: true, normalize: true });
    const embeddingArray = Array.from(queryEmbedding as number[]);

    // ── Step 2: pgvector similarity search ───────────────────────
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: chunks, error: searchError } = await db.rpc("rag_search", {
      query_embedding: JSON.stringify(embeddingArray),
      match_count: 8,
      filter_city: mentionedCity ?? null,
    });

    // ── Step 3: Build context block ──────────────────────────────
    let context = "";
    if (chunks && chunks.length > 0) {
      context = "\n\n## CONTEXT — Real SafeShe data retrieved for this query\n\n";

      // Group by source type for readability
      const scores  = chunks.filter((c: any) => c.source === "city_safety");
      const tips    = chunks.filter((c: any) => c.source === "tip");
      const reviews = chunks.filter((c: any) => c.source === "review");

      if (scores.length > 0) {
        context += "### Safety Scores\n";
        for (const c of scores) context += `- ${c.content} (relevance: ${(c.score * 100).toFixed(0)}%)\n`;
        context += "\n";
      }
      if (tips.length > 0) {
        context += "### Community Safety Tips\n";
        for (const c of tips) {
          const icon = c.severity === "warning" ? "⚠️" : c.severity === "caution" ? "🔶" : "ℹ️";
          context += `- ${icon} [${c.category}] ${c.content}\n`;
        }
        context += "\n";
      }
      if (reviews.length > 0) {
        context += "### Traveller Reviews\n";
        for (const c of reviews) context += `- ${c.content}\n`;
        context += "\n";
      }

      context += "## END CONTEXT\n\nBase your answer on the above context. If context doesn't cover something, use general knowledge but say so.";
    } else {
      context = "\n\n(No specific SafeShe data found for this query. Answer from general knowledge and suggest the user explore SafeShe for city-specific scores.)";
    }

    const finalSystemPrompt = SYSTEM_PROMPT + context;

    // ── Step 4: Call Groq (free Llama 3.1) ──────────────────────
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", err);
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content ?? "Sorry, no response received.";
    const chunksUsed = chunks?.length ?? 0;

    return new Response(JSON.stringify({
      reply,
      city: mentionedCity,
      chunksUsed,
      ragEnabled: chunksUsed > 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: `Unexpected error: ${err.message}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
