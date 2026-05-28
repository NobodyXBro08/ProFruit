import nodemailer from "nodemailer";

export type MailResult = { sent: boolean; error?: string };

/** Correo al cliente (Gmail SMTP). No usa Resend. */
export async function sendClienteConfirmacion(
  to: string,
  orderId: number,
  total: unknown
): Promise<MailResult> {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    return { sent: false, error: "Falta SMTP_USER o SMTP_PASS (correo Gmail de la tienda)." };
  }

  const text = [
    "Hola,",
    "",
    `Tu pedido #${orderId} en ProFruit quedó confirmado.`,
    `Total: ${total}.`,
    "",
    "Pronto te enviaremos novedades sobre el envío.",
    "",
    "Gracias por tu compra.",
    "ProFruit",
  ].join("\n");

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT?.trim() || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    await transport.sendMail({
      from: process.env.MAIL_FROM?.trim() || `ProFruit <${user}>`,
      to,
      subject: `ProFruit — Pedido #${orderId} confirmado`,
      text,
    });
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("MAIL cliente:", message);
    return { sent: false, error: message };
  }
}
