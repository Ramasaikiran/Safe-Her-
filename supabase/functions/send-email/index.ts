import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * send-email — Supabase Auth Hook
 *
 * Intercepts ALL Supabase auth emails and sends them via Resend.
 * Covers: signup OTP, password reset, magic link, email change.
 *
 * Register in Supabase Dashboard:
 *   Auth → Hooks → Send Email → select this edge function
 *
 * Secret required:
 *   supabase secrets set RESEND_API_KEY=re_HS6T9LQ5_...
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "SafeShe <noreply@safeshe.in>"; // change to your verified domain in Resend

// ── Email templates ────────────────────────────────────────────────

function signupTemplate(name: string, otp: string) {
  return {
    subject: `${otp} is your SafeShe verification code`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">🛡️</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px;">SafeShe</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">India's women travel safety network</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1A0A10;margin:0 0 12px;">Verify your email</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 28px;">
              Hi ${name || "there"} 👋 Welcome to SafeShe! Use the code below to verify your email address and complete your signup.
            </p>
            <!-- OTP Box -->
            <div style="background:#FAF7F4;border:2px solid #F5E6E8;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
              <div style="font-size:11px;font-weight:700;color:#9B8275;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Your verification code</div>
              <div style="font-size:42px;font-weight:900;letter-spacing:0.22em;color:#E8445A;font-family:monospace;">${otp}</div>
              <div style="font-size:12px;color:#9B8275;margin-top:12px;">Expires in 10 minutes</div>
            </div>
            <p style="font-size:13px;color:#9B8275;line-height:1.65;margin:0 0 20px;">
              If you didn't create a SafeShe account, you can safely ignore this email. This code cannot be used to access your account.
            </p>
            <div style="border-top:1px solid #F0EAE5;padding-top:20px;text-align:center;">
              <p style="font-size:12px;color:#C4B8B0;margin:0;">
                Need help? Reply to this email or contact us at<br/>
                <a href="mailto:support@safeshe.in" style="color:#E8445A;">support@safeshe.in</a>
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#FAF7F4;padding:20px 40px;text-align:center;border-top:1px solid #F0EAE5;">
            <p style="font-size:11px;color:#C4B8B0;margin:0;">
              © 2025 SafeShe · India's first women-only travel safety network<br/>
              <a href="#" style="color:#C4B8B0;">Unsubscribe</a>
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

function passwordResetTemplate(name: string, otp: string) {
  return {
    subject: `Reset your SafeShe password — code ${otp}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">🔐</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 12px;">Reset your password</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 28px;">
              Hi ${name || "there"}, we received a request to reset your SafeShe password. Use this code to continue:
            </p>
            <div style="background:#FAF7F4;border:2px solid #F5E6E8;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
              <div style="font-size:11px;font-weight:700;color:#9B8275;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;">Password reset code</div>
              <div style="font-size:42px;font-weight:900;letter-spacing:0.22em;color:#E8445A;font-family:monospace;">${otp}</div>
              <div style="font-size:12px;color:#9B8275;margin-top:12px;">Expires in 10 minutes</div>
            </div>
            <p style="font-size:13px;color:#9B8275;line-height:1.65;">
              If you didn't request a password reset, your account is safe — just ignore this email.
            </p>
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

function magicLinkTemplate(name: string, link: string) {
  return {
    subject: `Your SafeShe sign-in link`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(61,35,20,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">✨</div>
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 12px;">Your sign-in link</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 28px;">
              Hi ${name || "there"}! Click the button below to sign in to SafeShe. This link expires in 10 minutes.
            </p>
            <a href="${link}" style="display:inline-block;background:#E8445A;color:white;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none;margin-bottom:24px;">
              Sign in to SafeShe →
            </a>
            <p style="font-size:12px;color:#9B8275;">
              Or copy this link:<br/>
              <span style="font-size:11px;color:#C4B8B0;word-break:break-all;">${link}</span>
            </p>
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

function emailChangeTemplate(name: string, otp: string) {
  return {
    subject: `${otp} — confirm your new SafeShe email`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F4;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:white;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1A0A10 0%,#3D1520 100%);padding:32px 40px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:white;">SafeShe</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#1A0A10;margin:0 0 12px;">Confirm your new email</h1>
            <p style="font-size:15px;color:#6B5B4E;line-height:1.7;margin:0 0 28px;">
              Hi ${name || "there"}, use this code to confirm your new email address:
            </p>
            <div style="background:#FAF7F4;border:2px solid #F5E6E8;border-radius:16px;padding:28px;text-align:center;">
              <div style="font-size:42px;font-weight:900;letter-spacing:0.22em;color:#E8445A;font-family:monospace;">${otp}</div>
              <div style="font-size:12px;color:#9B8275;margin-top:12px;">Expires in 10 minutes</div>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

// ── Main handler ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { user, email_data } = payload;
  const toEmail: string = user?.email ?? "";
  const name: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "";
  const actionType: string = email_data?.email_action_type ?? "signup";
  const otp: string = email_data?.token ?? "";
  const tokenHash: string = email_data?.token_hash ?? "";
  const redirectTo: string = email_data?.redirect_to ?? "";

  if (!toEmail) {
    return new Response(JSON.stringify({ error: "No recipient email" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build magic link for link-based flows
  const magicLink = redirectTo
    ? `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}token_hash=${tokenHash}&type=${actionType}`
    : "";

  // Pick template based on action type
  let template: { subject: string; html: string };
  switch (actionType) {
    case "signup":
    case "email":
      template = signupTemplate(name, otp);
      break;
    case "recovery":
      template = passwordResetTemplate(name, otp);
      break;
    case "magiclink":
      template = magicLinkTemplate(name, magicLink || otp);
      break;
    case "email_change":
    case "email_change_new":
      template = emailChangeTemplate(name, otp);
      break;
    default:
      template = signupTemplate(name, otp);
  }

  // Send via Resend
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result.message ?? "Resend error" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent via Resend: ${actionType} → ${toEmail} (id: ${result.id})`);
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Network error sending email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
