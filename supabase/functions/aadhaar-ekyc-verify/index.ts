import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Step 2 of Aadhaar e-KYC: verify the OTP, receive the consented
// demographic data back from the provider (name + photo), and mark
// the guide verified. As with the initiate function, the provider
// call below is a placeholder -- exact field names depend on which
// provider you use.
//
// Only kyc_verified_name and kyc_photo_url are stored from the
// response -- never the Aadhaar number itself, address, or other
// demographic fields UIDAI rules don't require this app to retain.

const EKYC_API_KEY = Deno.env.get("EKYC_API_KEY");
const EKYC_API_BASE_URL = Deno.env.get("EKYC_API_BASE_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!EKYC_API_KEY || !EKYC_API_BASE_URL) {
    return new Response(JSON.stringify({ error: "Aadhaar verification is not configured yet." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { otp, reference_id } = await req.json();
    if (!otp || !reference_id) {
      return new Response(JSON.stringify({ error: "Missing OTP or reference." }), {
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

    const { data: guideProfile } = await userClient
      .from("guide_profiles")
      .select("kyc_reference_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!guideProfile || guideProfile.kyc_reference_id !== reference_id) {
      return new Response(JSON.stringify({ error: "This verification session doesn't match. Please start again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────
    // PLACEHOLDER -- replace with your provider's actual "Submit OTP /
    // Verify Aadhaar OTP" call. Expected to return verified demographic
    // data (name, photo as base64 or URL) on success.
    // ─────────────────────────────────────────────────────────
    const providerRes = await fetch(`${EKYC_API_BASE_URL}/aadhaar-v2/submit-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${EKYC_API_KEY}` },
      body: JSON.stringify({ client_id: reference_id, otp }),
    });
    const providerData = await providerRes.json();
    if (!providerRes.ok || providerData?.success === false) {
      console.error("e-KYC provider verification failed:", providerData);
      await userClient.from("guide_profiles").update({ kyc_status: "failed" }).eq("id", user.id);
      return new Response(JSON.stringify({ error: "That code didn't verify. Please check and try again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifiedName: string | undefined = providerData?.data?.full_name;
    const photoBase64: string | undefined = providerData?.data?.profile_image;
    // ─────────────────────────────────────────────────────────

    let photoUrl: string | null = null;
    if (photoBase64) {
      const bytes = Uint8Array.from(atob(photoBase64), (c) => c.charCodeAt(0));
      const path = `${user.id}/kyc-photo.jpg`;
      const { error: uploadErr } = await userClient.storage.from("avatars").upload(path, bytes, {
        contentType: "image/jpeg", upsert: true,
      });
      if (!uploadErr) {
        const { data: pub } = userClient.storage.from("avatars").getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }
    }

    const { error: updateErr } = await userClient.from("guide_profiles").update({
      kyc_status: "verified",
      kyc_verified_name: verifiedName || null,
      kyc_photo_url: photoUrl,
      kyc_verified_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (updateErr) {
      console.error("Failed to store kyc verified state:", updateErr);
      return new Response(JSON.stringify({ error: "Verified, but could not save the result. Please contact support." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, verified_name: verifiedName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("aadhaar-ekyc-verify error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
