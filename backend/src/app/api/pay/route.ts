import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Resend } from "resend";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { deductStockForConfirmedOrder, OrderError } from "@/lib/orders";
import { parsePaymentMethod } from "@/lib/orderValidators";

export function OPTIONS() {
  return corsOptionsResponse();
}

function parseOrderId(body: unknown): number | null {
  if (body === null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const raw = o.order_id ?? o.orderId;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function paymentProviderFromNotes(notes: unknown): string {
  const s = typeof notes === "string" ? notes : "";
  const match = s.match(/payment_method:([a-z]+)/);
  return match?.[1] ?? "manual";
}

type SendResult = { sent: boolean; error?: string };

async function enviarConResend(to: string, subject: string, text: string): Promise<SendResult> {
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

function formatShipping(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "—";
  try {
    const o = JSON.parse(raw) as { line?: string; city?: string; address?: string };
    if (typeof o.line === "string" && o.line.trim()) return o.line.trim();
    if (o.city && o.address) return `${o.address}, ${o.city}`;
  } catch {
    return raw.trim();
  }
  return raw.trim();
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const orderId = parseOrderId(raw.body);
    if (orderId === null) {
      return NextResponse.json({ error: "order_id inválido o ausente." }, { status: 400, headers: corsHeaders });
    }

    const bodyMethod = parsePaymentMethod(raw.body);

    const conn = await pool.getConnection();
    let order: RowDataPacket;
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT o.id, o.total, o.status, o.customer_name, o.customer_email, o.shipping_address, o.notes, u.email AS user_email
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = ?
         FOR UPDATE`,
        [orderId]
      );

      if (!rows.length) {
        await conn.rollback();
        return NextResponse.json({ error: "Orden no encontrada." }, { status: 404, headers: corsHeaders });
      }

      order = rows[0];

      if (String(order.status) !== "pending") {
        await conn.rollback();
        const msg =
          String(order.status) === "paid"
            ? "La orden ya está pagada."
            : "Solo se pueden confirmar pedidos en estado pendiente.";
        return NextResponse.json({ error: msg }, { status: 409, headers: corsHeaders });
      }

      const provider = bodyMethod ?? paymentProviderFromNotes(order.notes);
      if (provider === "mercadopago" || provider === "pse") {
        await conn.rollback();
        return NextResponse.json(
          {
            error: "Este pedido debe pagarse con Mercado Pago en línea.",
            useMercadoPago: true,
          },
          { status: 400, headers: corsHeaders }
        );
      }

      const customerEmail = normalizeEmail(
        typeof order.customer_email === "string" && order.customer_email.trim()
          ? order.customer_email
          : typeof order.user_email === "string"
            ? order.user_email
            : ""
      );

      if (!customerEmail) {
        await conn.rollback();
        return NextResponse.json({ error: "El pedido no tiene correo de contacto." }, { status: 400, headers: corsHeaders });
      }
      if (!isValidEmail(customerEmail)) {
        await conn.rollback();
        return NextResponse.json({ error: "El correo del pedido no es válido." }, { status: 400, headers: corsHeaders });
      }

      await deductStockForConfirmedOrder(conn, Number(order.id));

      await conn.query(
        "INSERT INTO payments (order_id, provider, amount, status) VALUES (?, ?, ?, ?)",
        [order.id, provider, Number(order.total), "completed"]
      );
      await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [order.id]);

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      console.error("PAY DB:", e);
      throw e;
    } finally {
      conn.release();
    }

    const orderNum = Number(order.id);
    const customerEmail = normalizeEmail(String(order.customer_email || order.user_email || ""));
    const customerName = String(order.customer_name || "Cliente");
    const shipping = formatShipping(order.shipping_address);

    const textoCliente = [
      `Hola ${customerName},`,
      "",
      `Tu pedido #${orderNum} fue confirmado.`,
      `Total: $${Number(order.total).toLocaleString("es-CO")} COP.`,
      `Dirección de envío: ${shipping}`,
      "",
      "Pronto te enviaremos novedades sobre el despacho.",
      "",
      "Gracias por comprar en ProFruit.",
    ].join("\n");

    const emailResult = await enviarConResend(
      customerEmail,
      "Confirmación de compra - ProFruit",
      textoCliente
    );

    const adminInbox = process.env.RESEND_ADMIN_EMAIL?.trim() || process.env.RESEND_TEST_INBOX?.trim() || "";
    if (adminInbox) {
      const adminNorm = normalizeEmail(adminInbox);
      if (adminNorm && adminNorm !== customerEmail) {
        await enviarConResend(
          adminNorm,
          `Nuevo pago #${orderNum} - ProFruit`,
          `Pedido #${orderNum}\nTotal: ${order.total}\nCliente: ${customerName} <${customerEmail}>\nEnvío: ${shipping}`
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: emailResult.sent
          ? "Pago registrado. Confirmación enviada a tu correo."
          : "Pago registrado. No se pudo enviar el correo; revisa la configuración de Resend.",
        emailSent: emailResult.sent,
        emailError: emailResult.error ?? null,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    console.error("PAY ERROR:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500, headers: corsHeaders });
  }
}
