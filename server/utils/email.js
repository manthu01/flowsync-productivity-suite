const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || "FlowSync <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

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

const send = async ({ to, subject, html }) => {
    if (!resend) {
        const link = html.match(/href="([^"]+)"/)?.[1];
        console.log(`[email:skipped - no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
        if (link) console.log(`  Link: ${link}`);
        return { skipped: true };
    }

    return resend.emails.send({ from: FROM, to, subject, html });
};

const sendVerificationEmail = (to, token) => {
    const link = `${APP_URL}/verify-email?token=${token}`;
    return send({
        to,
        subject: "Verify your FlowSync account",
        html: wrapper(
            "Confirm your email to activate your account",
            `<p style="color:#d4d4d8;font-size:15px;line-height:1.6;">Welcome to FlowSync! Click below to verify your email address. This link expires in 24 hours.</p>${button(link, "Verify Email")}`
        ),
    });
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

module.exports = { sendVerificationEmail, sendResetEmail };
