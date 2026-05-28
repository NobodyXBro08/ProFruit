import { Resend } from "resend";
import type { RowDataPacket } from "mysql2";

/** Misma lógica Resend que ya tenías; no modificar el comportamiento. */
export function normalizeRecipientEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

function parseSandboxAllowedEmail(message: string): string | null {
  const m = message.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
  return m ? normalizeRecipientEmail(m[1]) : null;
}

type ResendErr = { statusCode?: number; message?: string; name?: string };

function isResendSandboxRecipient403(err: unknown): boolean {
  const e = err as ResendErr;
  const msg = String(e?.message || "");
  return (e?.statusCode === 403 || msg.includes("403")) && msg.includes("testing emails");
}

export type ResendPayResult = { emailSent: boolean; message: string };

export async function sendResendPayNotification(
  order: RowDataPacket,
  apiKey: string
): Promise<ResendPayResult> {
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
  const customerEmail = normalizeRecipientEmail(String(order.email || ""));
  const testInbox = process.env.RESEND_TEST_INBOX?.trim()
    ? normalizeRecipientEmail(process.env.RESEND_TEST_INBOX)
    : "";

  const baseText = `Tu pedido #${order.id} fue confirmado. Total: ${order.total}.`;

  const sendOnce = (to: string, text: string) =>
    resend.emails.send({
      from,
      to: [to],
      subject: "Confirmación de compra",
      text,
    });

  let primaryTo = customerEmail;
  let primaryText = baseText;
  if (testInbox) {
    primaryTo = testInbox;
    primaryText = `${baseText}\n\n(Prueba Resend: el correo del usuario en la cuenta es ${customerEmail})`;
  }

  console.log("PAY Resend: destinatario primario =", primaryTo, "| email en pedido (users) =", customerEmail);

  let { error: emailError } = await sendOnce(primaryTo, primaryText);

  if (emailError && isResendSandboxRecipient403(emailError) && !testInbox) {
    const msg = String((emailError as ResendErr).message || "");
    const allowed = parseSandboxAllowedEmail(msg);
    if (allowed && allowed !== primaryTo) {
      const forwarded = `${baseText}\n\n(Prueba Resend: reenviado a tu bandeja verificada. Cliente en BD: ${customerEmail})`;
      ({ error: emailError } = await sendOnce(allowed, forwarded));
    }
  }

  if (emailError) {
    console.error("PAY Resend:", emailError);
    return {
      emailSent: false,
      message:
        "Pago registrado; no se pudo enviar el correo. En Resend (modo prueba) define RESEND_TEST_INBOX=tu_correo_de_cuenta o verifica un dominio en resend.com/domains.",
    };
  }

  return {
    emailSent: true,
    message: testInbox
      ? "Pago realizado. Correo enviado a RESEND_TEST_INBOX (modo prueba)."
      : "Pago realizado y correo enviado",
  };
}
