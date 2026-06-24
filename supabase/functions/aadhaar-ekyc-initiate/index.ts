import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Step 1 of Aadhaar e-KYC: send an OTP to the phone linked to the
// guide's Aadhaar number, via a licensed e-KYC provider (UIDAI does
// not allow direct unlicensed API access -- this MUST go through an
// authorized AUA/KUA, e.g. Surepass, Digio, Karza, IDfy).
//
// *** PROVIDER CALL BELOW IS A PLACEHOLDER ***
// The exact endpoint URL, request shape, and response field names
// depend on which provider you sign up with, and I don't have current
// access to their docs to get this exactly right blind. Replace the
// fetch() call in the marked section with your provider's documented
// "Generate Aadhaar OTP" request, using EKYC_API_KEY /
// EKYC_API_BASE_URL set as Edge Function secrets.
//
// Compliance note: this function never receives or stores the full
// Aadhaar number anywhere after this call completes -- only the
// provider's reference_id (to use in the verify step) is kept,
// alongside the last 4 digits for the guide's own reference.

const EKYC_API_KEY = Deno.env.get("EKYC_API_KEY");
const EKYC_API_BASE_URL = Deno.env.get("EKYC_API_BASE_URL");
const EKYC_PROVIDER = Deno.env.get("EKYC_PROVIDER") || "unconfigured";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidAadhaar(num: string): boolean {
  return /^\d{12}$/.test(num);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!EKYC_API_KEY || !EKYC_API_BASE_URL) {
    return new Response(
      JSON.stringify({ error: "Aadhaar verification is not configured yet. Set EKYC_API_KEY, EKYC_API_BASE_URL, and EKYC_PROVIDER in Edge Function secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { aadhaar_number } = await req.json();
    if (!aadhaar_number || !isValidAadhaar(String(aadhaar_number))) {
      return new Response(JSON.stringify({ error: "Enter a valid 12-digit Aadhaar number." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid session." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: allowed } = await userClient.rpc("check_rate_limit", {
      p_key: `ekyc_initiate:${user.id}`,
      p_max_count: 5,
      p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Too many verification attempts. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────
    // PLACEHOLDER -- replace with your provider's actual "Generate
    // Aadhaar OTP" call. This shape (Bearer auth, {aadhaar_number} body,
    // {request_id} in response) is a common pattern across providers
    // but is NOT guaranteed to match yours without checking their docs.
    // ─────────────────────────────────────────────────────────
    const providerRes = await fetch(`${EKYC_API_BASE_URL}/aadhaar-v2/generate-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${EKYC_API_KEY}` },
      body: JSON.stringify({ id_number: aadhaar_number }),
    });
    const providerData = await providerRes.json();
    if (!providerRes.ok) {
      console.error("e-KYC provider OTP generation failed:", providerData);
      return new Response(JSON.stringify({ error: "Could not send Aadhaar OTP. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const referenceId = providerData?.data?.client_id || providerData?.request_id;
    // ─────────────────────────────────────────────────────────

    const last4 = String(aadhaar_number).slice(-4);
    const { error: updateErr } = await userClient.from("guide_profiles").update({
      kyc_status: "pending",
      kyc_provider: EKYC_PROVIDER,
      kyc_reference_id: referenceId,
      kyc_aadhaar_last4: last4,
    }).eq("id", user.id);
    if (updateErr) console.error("Failed to store kyc pending state:", updateErr);

    return new Response(JSON.stringify({ ok: true, reference_id: referenceId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("aadhaar-ekyc-initiate error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
