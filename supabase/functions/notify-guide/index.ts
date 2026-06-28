import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * notify-guide
 * Sends transactional emails to guides when admin changes their status.
 * Called from AdminPanel after approve / reject / suspend actions.
 *
 * POST body: { to: string, name: string, status: 'active' | 'rejected' | 'suspended', reason?: string }
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "SafeShe <noreply@safeshe.in>";
const DASHBOARD_URL = "https://safe-her-pi.vercel.app/guide-dashboard";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Templates ──────────────────────────────────────────────────────

function approvedTemplate(name: string) {
  return {
    subject: "🎉 You're approved as a SafeShe Guide!",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🎉</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Guide Verification</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 12px;">You're approved, ${name}! ✓</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 20px;">
              Congratulations! Your SafeShe guide profile has been reviewed and approved by our team. You can now start accepting bookings from women travellers across India.
            </p>
            <div style="background:#F0F7F1;border-radius:14px;padding:20px;margin-bottom:24px;">
              <p style="font-size:13px;font-weight:700;color:#3D6B41;margin:0 0 10px;">✅ What's unlocked for you:</p>
              <ul style="font-size:13px;color:#4A7A4E;line-height:1.8;margin:0;padding-left:18px;">
                <li>Your profile is now visible to travellers</li>
                <li>You can receive and confirm bookings</li>
                <li>Payments via UPI/Razorpay are enabled</li>
                <li>Complete Aadhaar KYC to get the verified badge</li>
              </ul>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#E8445A;color:white;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none;">
                Go to Guide Dashboard →
              </a>
            </div>
            <p style="font-size:13px;color:#9B8275;line-height:1.65;margin:0;">
              Complete your profile — guides with full bios, photos, and specialties listed get <strong>3× more bookings</strong>. Set your hourly rate and availability now.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF7F4;padding:20px 40px;text-align:center;border-top:1px solid #F0EAE5;">
            <p style="font-size:11px;color:#C4B8B0;margin:0;">
              © 2025 SafeShe · India's first women-only travel safety network<br/>
              <a href="mailto:support@safeshe.in" style="color:#C4B8B0;">support@safeshe.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function rejectedTemplate(name: string, reason?: string) {
  return {
    subject: "Your SafeShe guide application — update",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 12px;">Hi ${name},</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 20px;">
              Thank you for applying to be a SafeShe guide. After reviewing your profile, we are unable to approve your application at this time.
            </p>
            ${reason ? `
            <div style="background:#FEF2F2;border-radius:14px;padding:16px 20px;margin-bottom:20px;border-left:3px solid #E8445A;">
              <p style="font-size:13px;font-weight:700;color:#E8445A;margin:0 0 6px;">Reason:</p>
              <p style="font-size:13px;color:#6B5B4E;margin:0;line-height:1.6;">${reason}</p>
            </div>` : ''}
            <p style="font-size:13px;color:#9B8275;line-height:1.65;margin:0 0 20px;">
              You're welcome to update your profile and reapply. If you believe this is an error or have questions, reply to this email and our team will help.
            </p>
            <div style="text-align:center;">
              <a href="mailto:support@safeshe.in" style="display:inline-block;background:#1A0A10;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;">
                Contact Support
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

function suspendedTemplate(name: string, reason?: string) {
  return {
    subject: "⚠️ Your SafeShe guide account has been suspended",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 12px;">Account suspended, ${name}</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 20px;">
              Your SafeShe guide account has been temporarily suspended. You will not be able to receive new bookings during this period.
            </p>
            ${reason ? `
            <div style="background:#FEF2F2;border-radius:14px;padding:16px 20px;margin-bottom:20px;border-left:3px solid #E8445A;">
              <p style="font-size:13px;font-weight:700;color:#E8445A;margin:0 0 6px;">Reason:</p>
              <p style="font-size:13px;color:#6B5B4E;margin:0;line-height:1.6;">${reason}</p>
            </div>` : ''}
            <p style="font-size:13px;color:#9B8275;line-height:1.65;margin:0 0 20px;">
              If you believe this is an error or want to appeal, please contact our safety team immediately.
            </p>
            <div style="text-align:center;">
              <a href="mailto:support@safeshe.in" style="display:inline-block;background:#E8445A;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;">
                Appeal this decision
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

// ── Handler ────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { to, name, status, reason } = await req.json();

    if (!to || !name || !status) {
      return new Response(JSON.stringify({ error: "to, name and status are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let template: { subject: string; html: string };
    switch (status) {
      case "active":    template = approvedTemplate(name); break;
      case "rejected":  template = rejectedTemplate(name, reason); break;
      case "suspended": template = suspendedTemplate(name, reason); break;
      default:
        return new Response(JSON.stringify({ error: `Unknown status: ${status}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result.message }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Guide notification sent: ${status} → ${to}`);
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
