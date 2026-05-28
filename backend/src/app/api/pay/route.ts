import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { deductStockForConfirmedOrder, OrderError } from "@/lib/orders";
import { isMailConfigured, normalizeEmail, sendMail, type MailResult } from "@/lib/mailer";
import { buildAdminOrderEmail, buildCustomerOrderEmail } from "@/lib/orderEmails";
import {
  isResendConfigured,
  resolveResendAdminEmail,
  sendResendEmail,
  type ResendSendResult,
} from "@/lib/resendMail";

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

/** Email del usuario dueño del pedido (users.email vía orders.user_id), no un correo fijo. */
function customerEmailFromOrder(row: RowDataPacket): string {
  return normalizeEmail(typeof row.email === "string" ? row.email : "");
}

async function sendCustomerConfirmation(
  customerEmail: string,
  order: RowDataPacket,
  orderId: number
): Promise<MailResult | ResendSendResult> {
  const mail = buildCustomerOrderEmail(orderId, order.total, customerEmail, order);

  if (isMailConfigured()) {
    return sendMail({
      to: customerEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }

  if (isResendConfigured()) {
    return sendResendEmail({
      to: customerEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }

  return { sent: false, error: "Sin SMTP ni Resend para el correo al cliente." };
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const orderId = parseOrderId(raw.body);
    if (orderId === null) {
      return NextResponse.json({ error: "order_id inválido o ausente." }, { status: 400, headers: corsHeaders });
    }

    if (!isResendConfigured() && !isMailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Correo no configurado. Define RESEND_API_KEY (admin) y/o SMTP_USER + SMTP_PASS (cliente con HTML).",
        },
        { status: 503, headers: corsHeaders }
      );
    }

    const conn = await pool.getConnection();
    let order: RowDataPacket;
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT o.id, o.total, o.status, o.user_id, u.email, u.username, u.full_name
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

      const customerEmail = customerEmailFromOrder(order);
      if (!customerEmail) {
        await conn.rollback();
        return NextResponse.json({ error: "Usuario sin email." }, { status: 400, headers: corsHeaders });
      }

      await deductStockForConfirmedOrder(conn, Number(order.id));

      await conn.query(
        `INSERT INTO payments (order_id, provider, amount, currency, status)
         VALUES (?, 'manual', ?, 'COP', 'completed')`,
        [order.id, Number(order.total)]
      );
      await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [order.id]);

      await conn.commit();
    } catch (e) {
      try {
        await conn.rollback();
      } catch {
        /* conexión ya cerrada */
      }
      if (e instanceof OrderError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      console.error("PAY DB:", msg);
      throw new OrderError(`Error al confirmar el pago: ${msg}`, 500);
    } finally {
      conn.release();
    }

    const id = Number(order.id);
    const customerEmail = customerEmailFromOrder(order);
    const adminEmail = resolveResendAdminEmail();
    const adminMail = buildAdminOrderEmail(id, order.total, customerEmail, order);

    console.log(
      "PAY: correo cliente (users.email del pedido) =",
      customerEmail,
      "| admin Resend =",
      adminEmail || "(no)"
    );

    const customerOutcome = await sendCustomerConfirmation(customerEmail, order, id);

    let adminOutcome: ResendSendResult = { sent: !adminEmail };
    if (adminEmail && isResendConfigured()) {
      if (adminEmail === customerEmail && customerOutcome.sent) {
        adminOutcome = { sent: true };
      } else {
        adminOutcome = await sendResendEmail({
          to: adminEmail,
          subject: adminMail.subject,
          text: adminMail.text,
        });
      }
    } else if (adminEmail && !isResendConfigured()) {
      adminOutcome = { sent: false, error: "RESEND_API_KEY no definida para aviso al administrador." };
    }

    const customerOk = customerOutcome.sent;
    const adminOk = adminOutcome.sent;

    if (!customerOk) console.error("PAY correo cliente:", customerOutcome.error);
    if (adminEmail && !adminOk) console.error("PAY Resend admin:", adminOutcome.error);

    if (!customerOk || (adminEmail && !adminOk)) {
      const parts = ["Pago registrado."];
      if (!customerOk) {
        parts.push("No se envió la confirmación al correo del cliente.");
        if (customerOutcome.error) parts.push(customerOutcome.error);
      }
      if (adminEmail && !adminOk) parts.push("No se envió la notificación al administrador (Resend).");
      return NextResponse.json(
        {
          success: true,
          message: parts.join(" "),
          emailSent: false,
          emailSentToCustomer: customerOk,
          emailSentToAdmin: adminOk,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: adminEmail
          ? "Pago realizado. Confirmación al cliente y aviso al administrador enviados."
          : "Pago realizado. Confirmación enviada al correo del cliente.",
        emailSent: true,
        emailSentToCustomer: true,
        emailSentToAdmin: adminOk,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    console.error("PAY ERROR:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno del servidor.", details },
      { status: 500, headers: corsHeaders }
    );
  }
}
