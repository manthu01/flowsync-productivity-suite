// Sends transactional email via Brevo's HTTPS API (not raw SMTP) — Render's free tier
// blocks outbound SMTP entirely (confirmed: both port 465 and 587 timed out), so an
// API-over-HTTPS provider is the only free option that actually works there. Brevo's
// free tier needs only a single verified sender email, not a whole domain.
const BREVO_API_KEY = process.env.BREVO_API_KEY;

const FROM = process.env.EMAIL_FROM || "FlowSync <no-reply@flowsync.app>";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

// Splits "FlowSync <someone@example.com>" into { name, email } for Brevo's API shape.
const parseFrom = (from) => {
    const match = from.match(/^(.*?)\s*<(.+)>$/);
    return match ? { name: match[1] || "FlowSync", email: match[2] } : { name: "FlowSync", email: from };
};

const wrapper = (title, bodyHtml) => `
<div style="background:#030303;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#0a0a0c;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:36px;">
    <h1 style="color:#fff;font-size:22px;margin:0 0 4px;">FlowSync</h1>
    <p style="color:#71717a;font-size:13px;margin:0 0 28px;">${title}</p>
    ${bodyHtml}
    <p style="color:#52525b;font-size:12px;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>`;

const button = (href, label) => `
  <a href="${href}" style="display:inline-block;background:#22d3ee;color:#000;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:12px;font-size:14px;">${label}</a>`;

const escapeHtml = (str) =>
    str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const send = async ({ to, subject, html }) => {
    if (!BREVO_API_KEY) {
        const link = html.match(/href="([^"]+)"/)?.[1];
        console.log(`[email:skipped - no BREVO_API_KEY] To: ${to} | Subject: ${subject}`);
        if (link) console.log(`  Link: ${link}`);
        return { skipped: true };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            sender: parseFrom(FROM),
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Brevo API error ${response.status}: ${body}`);
    }

    return response.json();
};

const sendResetEmail = (to, token) => {
    const link = `${APP_URL}/reset-password?token=${token}`;
    return send({
        to,
        subject: "Reset your FlowSync password",
        html: wrapper(
            "Reset your password",
            `<p style="color:#d4d4d8;font-size:15px;line-height:1.6;">We received a request to reset your password. This link expires in 1 hour.</p>${button(link, "Reset Password")}`
        ),
    });
};

const sendContactNotification = ({ name, email, message }) => {
    const notifyTo = process.env.CONTACT_NOTIFY_EMAIL;
    if (!notifyTo) {
        console.log(`[email:skipped - no CONTACT_NOTIFY_EMAIL] New contact message from ${name} <${email}>`);
        return Promise.resolve({ skipped: true });
    }

    return send({
        to: notifyTo,
        subject: `New contact form message from ${name}`,
        html: wrapper(
            "Someone submitted the Contact Us form",
            `<p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
             <p style="color:#d4d4d8;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>`
        ),
    });
};

module.exports = { sendResetEmail, sendContactNotification };
