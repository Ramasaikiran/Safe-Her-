import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * embed-safety-data
 * Run once (or on cron) to embed all safety_tips, city_safety, guide_reviews.
 * Uses Supabase built-in gte-small — free, no external API.
 * Invoke: supabase functions invoke embed-safety-data
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results = { tips: 0, cities: 0, reviews: 0, errors: [] as string[] };

  // Supabase AI session — gte-small runs inside edge runtime, free
  // @ts-ignore — Supabase edge runtime global
  const session = new Supabase.ai.Session("gte-small");

  async function embed(text: string): Promise<number[]> {
    const output = await session.run(text, { mean_pool: true, normalize: true });
    return Array.from(output as number[]);
  }

  async function updateEmbedding(table: string, id: string, embedding: number[]) {
    await db.from(table).update({ embedding: JSON.stringify(embedding) }).eq("id", id);
  }

  try {
    // 1. Safety tips
    const { data: tips } = await db.from("safety_tips").select("id,city,category,tip").is("embedding", null);
    for (const t of tips || []) {
      try {
        const emb = await embed(`${t.city} ${t.category}: ${t.tip}`);
        await updateEmbedding("safety_tips", t.id, emb);
        results.tips++;
      } catch (e: any) { results.errors.push(`tip:${t.id}: ${e.message}`); }
    }

    // 2. City safety
    const { data: cities } = await db.from("city_safety").select("id,city,overall_score,night_score,transport_score,solo_traveller_score,summary").is("embedding", null);
    for (const c of cities || []) {
      try {
        const text = `${c.city} safety scores: overall ${c.overall_score}, night ${c.night_score}, transport ${c.transport_score}, solo traveller ${c.solo_traveller_score}. ${c.summary}`;
        const emb = await embed(text);
        await updateEmbedding("city_safety", c.id, emb);
        results.cities++;
      } catch (e: any) { results.errors.push(`city:${c.id}: ${e.message}`); }
    }

    // 3. Guide reviews
    const { data: reviews } = await db.from("guide_reviews").select("id,city,rating,comment").is("embedding", null).not("comment", "is", null);
    for (const r of reviews || []) {
      try {
        const emb = await embed(`${r.city || ""} guide review ${r.rating} stars: ${r.comment}`);
        await updateEmbedding("guide_reviews", r.id, emb);
        results.reviews++;
      } catch (e: any) { results.errors.push(`review:${r.id}: ${e.message}`); }
    }

    return new Response(JSON.stringify({ ok: true, embedded: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
