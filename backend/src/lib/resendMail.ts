import { Resend } from "resend";
import { normalizeEmail } from "@/lib/mailer";

export type ResendSendResult = { sent: boolean; error?: string };

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Correo del administrador (Resend). Compatible con variables que ya usabas en Railway. */
export function resolveResendAdminEmail(): string {
  const raw =
    process.env.RESEND_ADMIN_EMAIL?.trim() || process.env.RESEND_TEST_INBOX?.trim() || "";
  return raw ? normalizeEmail(raw) : "";
}

function resendFromAddress(): string {
  return process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
}

export async function sendResendEmail(payload: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY no definida." };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [payload.to],
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  if (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: string }).message)
        : String(error);
    console.error("RESEND:", message);
    return { sent: false, error: message };
  }

  return { sent: true };
}
