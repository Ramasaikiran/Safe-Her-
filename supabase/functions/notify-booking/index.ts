import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * notify-booking
 * Sends booking confirmation emails to travellers.
 * Called after guide or hostel booking is created.
 *
 * POST body: { to, name, type, itemName, date, amount, bookingId, city? }
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "SafeShe <noreply@safeshe.in>";
const DASHBOARD_URL = "https://safe-her-pi.vercel.app/dashboard";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function guideBookingTemplate(name: string, guideName: string, date: string, amount: number, hours: number, bookingId: string) {
  return {
    subject: `✅ Guide booking confirmed — ${guideName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🛡️</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Booking Confirmed</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 8px;">You're all set, ${name}! ✓</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 24px;">Your guide booking is confirmed. Here are your details:</p>

            <div style="background:#FAF7F4;border-radius:14px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;width:40%;">Guide</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${guideName}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Date</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${date}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Duration</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${hours} hours</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Amount</td><td style="padding:6px 0;font-size:15px;font-weight:900;color:#E8445A;">₹${amount.toLocaleString('en-IN')}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Booking ID</td><td style="padding:6px 0;font-size:11px;color:#9B8275;font-family:monospace;">${bookingId.slice(0,8).toUpperCase()}</td></tr>
              </table>
            </div>

            <div style="background:#F0F7F1;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
              <p style="font-size:13px;font-weight:700;color:#3D6B41;margin:0 0 8px;">What happens next:</p>
              <ul style="font-size:13px;color:#4A7A4E;line-height:1.8;margin:0;padding-left:18px;">
                <li>Your guide will contact you within 2 hours</li>
                <li>Share your live location when the trip starts</li>
                <li>SOS button is always available if you need help</li>
              </ul>
            </div>

            <div style="text-align:center;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#E8445A;color:white;font-weight:700;font-size:14px;padding:13px 32px;border-radius:50px;text-decoration:none;">
                View booking →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF7F4;padding:20px 40px;text-align:center;border-top:1px solid #F0EAE5;">
            <p style="font-size:11px;color:#C4B8B0;margin:0;">© 2025 SafeShe · <a href="mailto:support@safeshe.in" style="color:#C4B8B0;">support@safeshe.in</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function hostelBookingTemplate(name: string, hostelName: string, checkIn: string, checkOut: string, nights: number, amount: number, bookingId: string) {
  return {
    subject: `✅ Stay confirmed — ${hostelName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🏠</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Stay Confirmed</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 8px;">Booking confirmed, ${name}! ✓</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 24px;">Your safe stay is booked. Details below:</p>

            <div style="background:#FAF7F4;border-radius:14px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;width:40%;">Hostel</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${hostelName}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Check-in</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${checkIn}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Check-out</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${checkOut}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Nights</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1A0A10;">${nights} night${nights > 1 ? 's' : ''}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Total</td><td style="padding:6px 0;font-size:15px;font-weight:900;color:#E8445A;">₹${amount.toLocaleString('en-IN')}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9B8275;">Booking ID</td><td style="padding:6px 0;font-size:11px;color:#9B8275;font-family:monospace;">${bookingId.slice(0,8).toUpperCase()}</td></tr>
              </table>
            </div>

            <div style="background:#FEF9EC;border-radius:14px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #FFB800;">
              <p style="font-size:13px;color:#8A6A00;margin:0;">⏰ Free cancellation up to 12 hours before check-in.</p>
            </div>

            <div style="text-align:center;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#E8445A;color:white;font-weight:700;font-size:14px;padding:13px 32px;border-radius:50px;text-decoration:none;">
                View booking →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF7F4;padding:20px 40px;text-align:center;border-top:1px solid #F0EAE5;">
            <p style="font-size:11px;color:#C4B8B0;margin:0;">© 2025 SafeShe · <a href="mailto:support@safeshe.in" style="color:#C4B8B0;">support@safeshe.in</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { to, name, type, itemName, date, checkIn, checkOut, nights, amount, hours, bookingId } = body;

    if (!to || !name || !type) {
      return new Response(JSON.stringify({ error: "to, name and type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = type === 'guide'
      ? guideBookingTemplate(name, itemName, date, amount, hours || 1, bookingId)
      : hostelBookingTemplate(name, itemName, checkIn, checkOut, nights || 1, amount, bookingId);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: template.subject, html: template.html }),
    });

    const result = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result.message }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
