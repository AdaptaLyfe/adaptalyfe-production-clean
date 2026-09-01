import sgMail from "@sendgrid/mail";

type PasswordResetEmail = {
  to: string;
  name: string;
  token: string;
  origin: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addToken(urlValue: string, token: string): string {
  const url = new URL(urlValue);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
  origin,
}: PasswordResetEmail): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("Password reset email is not configured: SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required");
  }

  const configuredWebUrl = process.env.APP_RESET_PASSWORD_URL || `${origin}/reset-password`;
  const webUrl = addToken(configuredWebUrl, token);
  const mobileUrl = addToken(process.env.MOBILE_RESET_PASSWORD_URL || "adaptalyfe://reset-password", token);
  const safeName = escapeHtml(name || "there");

  sgMail.setApiKey(apiKey);
  await sgMail.send({
    to,
    from: {
      email: fromEmail,
      name: process.env.SENDGRID_FROM_NAME || "Adaptalyfe",
    },
    subject: "Reset your Adaptalyfe password",
    text: [
      `Hi ${name || "there"},`,
      "",
      "We received a request to reset your Adaptalyfe password.",
      `Open this link to continue: ${webUrl}`,
      "",
      "If you are using the Adaptalyfe mobile app, open this link on your device: " + mobileUrl,
      "",
      "This link expires in 1 hour and can only be used once. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033;max-width:560px">
        <h2>Reset your Adaptalyfe password</h2>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your Adaptalyfe password.</p>
        <p><a href="${webUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Reset password</a></p>
        <p style="font-size:14px">Using the mobile app? <a href="${mobileUrl}">Open the reset link in Adaptalyfe</a>.</p>
        <p style="font-size:14px;color:#5b6475">This link expires in 1 hour and can only be used once. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}