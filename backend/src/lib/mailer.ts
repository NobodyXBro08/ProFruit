import nodemailer from "nodemailer";

export type MailResult = { sent: boolean; error?: string };

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

/** Envío simple por SMTP (Gmail, Outlook, etc.). */
export async function sendBasicMail(
  to: string,
  subject: string,
  text: string
): Promise<MailResult> {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    return { sent: false, error: "SMTP_USER o SMTP_PASS no configurados." };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT?.trim() || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  const from = process.env.MAIL_FROM?.trim() || `ProFruit <${user}>`;

  try {
    await transport.sendMail({ from, to, subject, text });
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("MAIL:", message);
    return { sent: false, error: message };
  }
}
