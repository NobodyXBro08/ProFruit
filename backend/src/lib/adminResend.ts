import { Resend } from "resend";

export type MailResult = { sent: boolean; error?: string };

function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

function parseSandboxAllowedEmail(message: string): string | null {
  const m = message.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
  return m ? normalizeEmail(m[1]) : null;
}

type ResendErr = { statusCode?: number; message?: string };

function resendErrMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as ResendErr).message || "");
  }
  return String(err);
}

function isResendSandbox403(err: unknown): boolean {
  const msg = resendErrMessage(err);
  const e = err as ResendErr;
  return (e?.statusCode === 403 || msg.includes("403")) && msg.includes("testing emails");
}

export function resolveAdminInbox(): string {
  const raw =
    process.env.RESEND_TEST_INBOX?.trim() || process.env.RESEND_ADMIN_EMAIL?.trim() || "";
  return raw ? normalizeEmail(raw) : "";
}

/** Aviso al administrador. Solo Resend (como ya tenías). */
export async function sendAdminPedidoResend(
  orderId: number,
  total: unknown,
  customerEmail: string
): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const adminTo = resolveAdminInbox();
  if (!apiKey) return { sent: false, error: "RESEND_API_KEY no definida." };
  if (!adminTo) return { sent: false, error: "RESEND_TEST_INBOX o RESEND_ADMIN_EMAIL no definido." };

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
  const body = [
    "Nuevo pedido pagado en ProFruit.",
    "",
    `Pedido: #${orderId}`,
    `Total: ${total}`,
    `Cliente: ${customerEmail}`,
  ].join("\n");

  const dispatch = (to: string, text: string) =>
    resend.emails.send({
      from,
      to: [to],
      subject: `ProFruit — Nuevo pago #${orderId}`,
      text,
    });

  let { error } = await dispatch(adminTo, body);
  if (!error) return { sent: true };

  let msg = resendErrMessage(error);
  if (isResendSandbox403(error)) {
    const allowed = parseSandboxAllowedEmail(msg);
    if (allowed && allowed !== adminTo) {
      ({ error } = await dispatch(
        allowed,
        `${body}\n\n(Resend modo prueba: copia en ${allowed})`
      ));
      if (!error) return { sent: true };
      msg = resendErrMessage(error);
    }
  }

  console.error("RESEND admin:", msg);
  return { sent: false, error: msg };
}
