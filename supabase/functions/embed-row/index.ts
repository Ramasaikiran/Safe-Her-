import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * embed-row
 * Called by Postgres triggers on INSERT/UPDATE.
 * Embeds a single row automatically — zero manual steps.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildText(table: string, row: Record<string, any>): string {
  switch (table) {
    case "safety_tips":
      return `${row.city} ${row.category}: ${row.tip}`;
    case "city_safety":
      return `${row.city} safety: overall ${row.overall_score}, night ${row.night_score}, transport ${row.transport_score}, solo ${row.solo_traveller_score}. ${row.summary ?? ""}`;
    case "guide_reviews":
      return `${row.city ?? ""} guide review ${row.rating} stars: ${row.comment ?? ""}`;
    default:
      return JSON.stringify(row);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { table, record } = await req.json();
    if (!table || !record?.id) {
      return new Response(JSON.stringify({ error: "table and record.id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = buildText(table, record).trim();
    if (!text) {
      return new Response(JSON.stringify({ skipped: true, reason: "empty text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore — Supabase edge runtime global, free, no external API
    const session = new Supabase.ai.Session("gte-small");
    const output = await session.run(text, { mean_pool: true, normalize: true });
    const embedding = Array.from(output as number[]);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await db
      .from(table)
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", record.id);

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ ok: true, table, id: record.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("embed-row error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
