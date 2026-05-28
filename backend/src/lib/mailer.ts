import nodemailer from "nodemailer";

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailResult = { sent: boolean; error?: string };

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export function isMailConfigured(): boolean {
  return smtpConfigured();
}

export async function sendMail(payload: MailPayload): Promise<MailResult> {
  if (!smtpConfigured()) {
    return { sent: false, error: "SMTP no configurado (SMTP_USER y SMTP_PASS)." };
  }

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const from =
    process.env.MAIL_FROM?.trim() || process.env.SMTP_FROM?.trim() || `ProFruit <${user}>`;

  const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  try {
    await transport.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("MAIL:", message);
    return { sent: false, error: message };
  }
}

export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}
