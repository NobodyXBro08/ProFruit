import { Resend } from "resend";

export type SendResult = { sent: boolean; error?: string };

export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendWithResend(to: string, subject: string, text: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY no configurada en el backend." };
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
    const { error } = await resend.emails.send({ from, to: [to], subject, text });
    if (error) {
      console.error("Resend:", error);
      return { sent: false, error: error.message || "Error al enviar correo." };
    }
    return { sent: true };
  } catch (e) {
    console.error("Resend:", e);
    const msg = e instanceof Error ? e.message : "Error al enviar correo.";
    return { sent: false, error: msg };
  }
}

export function formatShippingLine(city: string, address: string): string {
  return `${address}, ${city}`.trim();
}

export function paymentMethodLabel(method: string): string {
  if (method === "whatsapp") return "Atención por WhatsApp";
  if (method === "efectivo") return "Efectivo contra entrega";
  return method;
}

export interface OrderEmailLine {
  name: string;
  quantity: number;
  lineTotal: number;
}

export function buildOrderReceivedEmail(input: {
  orderId: number;
  customerName: string;
  total: number;
  paymentMethod: string;
  shippingLine: string;
  lines: OrderEmailLine[];
}): string {
  const itemsText = input.lines
    .map((l) => `- ${l.name} × ${l.quantity} — $${l.lineTotal.toLocaleString("es-CO")} COP`)
    .join("\n");

  const payNote =
    input.paymentMethod === "efectivo"
      ? "Forma de pago: efectivo o contra entrega al recibir tu pedido."
      : "Forma de pago: coordinación por WhatsApp.";

  return [
    `Hola ${input.customerName},`,
    "",
    `Recibimos tu pedido #${input.orderId}.`,
    "",
    "Productos:",
    itemsText,
    "",
    `Total: $${input.total.toLocaleString("es-CO")} COP`,
    `Envío: ${input.shippingLine}`,
    payNote,
    "",
    "Te contactaremos pronto con novedades sobre el despacho.",
    "",
    "Gracias por comprar en ProFruit.",
  ].join("\n");
}
