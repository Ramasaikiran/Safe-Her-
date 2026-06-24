import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Creates a Razorpay Order for a booking and stores the order id on it.
// Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set as Edge Function
// secrets (Supabase Dashboard -> Project Settings -> Edge Functions).
// Callable only by an authenticated user (verify_jwt: true), and only
// ever touches bookings the caller owns (enforced by RLS via the
// user-scoped client below, not by the function's own logic).
// Rate limited per user (10 order attempts / hour) via the same
// check_rate_limit() Postgres function used elsewhere in the project.

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return new Response(
      JSON.stringify({ error: "Payments are not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Edge Function secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RLS-scoped client (uses the caller's own JWT) -- this will only
    // return the booking if it belongs to the caller, because the
    // bookings table's SELECT policy is `auth.uid() = traveller_id`.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: allowed } = await userClient.rpc("check_rate_limit", {
      p_key: `razorpay_order:${user.id}`,
      p_max_count: 10,
      p_window_seconds: 3600,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Too many payment attempts. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: booking, error: bookingErr } = await userClient
      .from("bookings")
      .select("id, amount, payment_status")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (booking.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "This booking is already paid." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountPaise = Math.round(Number(booking.amount) * 100);

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: booking.id,
        notes: { booking_id: booking.id },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error("Razorpay order creation failed:", order);
      return new Response(
        JSON.stringify({ error: order?.error?.description || "Could not create payment order." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateErr } = await userClient
      .from("bookings")
      .update({ razorpay_order_id: order.id })
      .eq("id", booking.id);

    if (updateErr) {
      console.error("Failed to store razorpay_order_id on booking:", updateErr);
    }

    return new Response(
      JSON.stringify({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: RAZORPAY_KEY_ID }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-razorpay-order error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
