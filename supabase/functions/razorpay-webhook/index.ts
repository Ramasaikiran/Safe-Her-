import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Receives Razorpay's payment webhook. This is the ONLY thing in the
// whole flow allowed to mark a booking 'paid' -- never the frontend.
// Authenticity is verified via HMAC-SHA256 over the raw request body
// using RAZORPAY_WEBHOOK_SECRET (set when you create the webhook in
// the Razorpay dashboard -- this is a separate secret from your API
// key/secret pair). verify_jwt is OFF for this function since Razorpay
// doesn't send a Supabase auth token; the signature check below is
// what stands in for auth here.

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifySignature(body: string, signatureHex: string, secret: string): Promise<boolean> {
  if (!signatureHex) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expectedHex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expectedHex.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!WEBHOOK_SECRET) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set -- rejecting webhook.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  const valid = await verifySignature(rawBody, signature, WEBHOOK_SECRET);
  if (!valid) {
    console.error("Invalid Razorpay webhook signature -- request rejected.");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const event = payload.event;

  try {
    if (event === "payment.captured" || event === "order.paid") {
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;
      if (orderId) {
        const { error } = await supabase
          .from("bookings")
          .update({ payment_status: "paid", razorpay_payment_id: paymentId, status: "confirmed" })
          .eq("razorpay_order_id", orderId);
        if (error) console.error("Failed to mark booking paid:", error);
      }
    } else if (event === "payment.failed") {
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        const { error } = await supabase
          .from("bookings")
          .update({ payment_status: "failed" })
          .eq("razorpay_order_id", orderId);
        if (error) console.error("Failed to mark booking failed:", error);
      }
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("razorpay-webhook processing error:", err);
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
