import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { deductStockForConfirmedOrder, OrderError } from "@/lib/orders";
import { isSmtpConfigured, normalizeEmail, sendBasicMail, type MailResult } from "@/lib/mailer";
import { normalizeRecipientEmail, sendResendPayNotification } from "@/lib/resendPay";

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

function buildCustomerSmtpText(orderId: number, total: unknown, email: string): string {
  return [
    "Hola,",
    "",
    `Confirmamos tu pedido #${orderId} en ProFruit.`,
    `Total: ${total}.`,
    "",
    "Pronto te enviaremos novedades sobre el envío.",
    "",
    "Equipo ProFruit",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const orderId = parseOrderId(raw.body);
    if (orderId === null) {
      return NextResponse.json({ error: "order_id inválido o ausente." }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.error("PAY: RESEND_API_KEY no definida.");
      return NextResponse.json(
        { error: "Configuración del servidor incompleta (RESEND_API_KEY)." },
        { status: 503, headers: corsHeaders }
      );
    }

    const conn = await pool.getConnection();
    let order: RowDataPacket;
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT o.id, o.total, o.status, u.email
         FROM orders o
         INNER JOIN users u ON o.user_id = u.id
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

      const emailRaw = typeof order.email === "string" ? order.email : "";
      const email = normalizeRecipientEmail(emailRaw);
      if (!email) {
        await conn.rollback();
        return NextResponse.json({ error: "Usuario sin email." }, { status: 400, headers: corsHeaders });
      }

      await deductStockForConfirmedOrder(conn, Number(order.id));

      await conn.query(
        "INSERT INTO payments (order_id, amount, status) VALUES (?, ?, ?)",
        [order.id, Number(order.total), "completed"]
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
    const customerEmail = normalizeEmail(String(order.email || ""));

    const resendResult = await sendResendPayNotification(order, apiKey);

    let smtpToCustomer: MailResult = { sent: false };
    if (isSmtpConfigured()) {
      console.log("PAY SMTP: confirmación al cliente logueado =", customerEmail);
      smtpToCustomer = await sendBasicMail(
        customerEmail,
        `ProFruit — Pedido #${orderNum} confirmado`,
        buildCustomerSmtpText(orderNum, order.total, customerEmail)
      );
      if (!smtpToCustomer.sent) {
        console.error("PAY SMTP cliente:", smtpToCustomer.error);
      }
    }

    const body: Record<string, unknown> = {
      success: true,
      message: resendResult.message,
      emailSent: resendResult.emailSent,
      emailSentToCustomer: smtpToCustomer.sent,
    };

    if (smtpToCustomer.sent) {
      body.message = `${resendResult.message} Confirmación enviada al correo de tu cuenta (${customerEmail}).`;
      body.emailSentToCustomer = true;
    } else if (isSmtpConfigured() && !smtpToCustomer.sent) {
      body.smtpCustomerError = smtpToCustomer.error;
    }

    return NextResponse.json(body, { status: 200, headers: corsHeaders });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    console.error("PAY ERROR:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500, headers: corsHeaders });
  }
}
