import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Resend } from "resend";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { deductStockForConfirmedOrder, OrderError } from "@/lib/orders";

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

function parseSandboxAllowedEmail(message: string): string | null {
  const m = message.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
  return m ? normalizeEmail(m[1]) : null;
}

type ResendErr = { statusCode?: number; message?: string; name?: string };

function resendErrMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as ResendErr).message || "");
  }
  return String(err);
}

function isResendSandboxRecipient403(err: unknown): boolean {
  const msg = resendErrMessage(err);
  const e = err as ResendErr;
  return (e?.statusCode === 403 || msg.includes("403")) && msg.includes("testing emails");
}

function buildConfirmacionText(orderId: number, total: unknown): string {
  return `Tu pedido #${orderId} fue confirmado. Total: ${total}. Pronto te enviaremos novedades sobre el envío.`;
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

      const customerEmail = normalizeEmail(typeof order.email === "string" ? order.email : "");
      if (!customerEmail) {
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

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
    const customerEmail = normalizeEmail(String(order.email || ""));
    const adminInbox = process.env.RESEND_TEST_INBOX?.trim()
      ? normalizeEmail(process.env.RESEND_TEST_INBOX)
      : process.env.RESEND_ADMIN_EMAIL?.trim()
        ? normalizeEmail(process.env.RESEND_ADMIN_EMAIL)
        : "";

    const orderNum = Number(order.id);
    const text = buildConfirmacionText(orderNum, order.total);

    const sendTo = async (to: string, body: string) => {
      const result = await resend.emails.send({
        from,
        to: [to],
        subject: "Confirmación de compra - ProFruit",
        text: body,
      });
      return { ok: !result.error, error: result.error };
    };

    console.log("PAY Resend → cliente (users.email):", customerEmail);

    let clienteOk = false;
    let clienteError = "";

    let r = await sendTo(customerEmail, text);
    if (r.ok) {
      clienteOk = true;
    } else {
      clienteError = resendErrMessage(r.error);
      console.error("PAY Resend cliente:", clienteError);

      if (isResendSandboxRecipient403(r.error)) {
        const allowed = parseSandboxAllowedEmail(clienteError);
        if (allowed && allowed !== customerEmail) {
          const copia = `${text}\n\n(No se pudo enviar a ${customerEmail}; copia de prueba Resend.)`;
          const r2 = await sendTo(allowed, copia);
          if (r2.ok) clienteError = `Modo prueba Resend: solo permite ${allowed}. Cliente en BD: ${customerEmail}.`;
        }
      }
    }

    let adminOk = !adminInbox;
    if (adminInbox && adminInbox !== customerEmail) {
      const adminText = `${text}\n\nCorreo del cliente en la cuenta: ${customerEmail}`;
      console.log("PAY Resend → admin:", adminInbox);
      const ra = await sendTo(adminInbox, adminText);
      adminOk = ra.ok;
      if (!ra.ok) console.error("PAY Resend admin:", resendErrMessage(ra.error));
    } else if (adminInbox === customerEmail) {
      adminOk = clienteOk;
    }

    if (clienteOk) {
      return NextResponse.json(
        {
          success: true,
          message: "Pago realizado. Confirmación enviada al correo de tu cuenta.",
          emailSent: true,
          emailSentToCustomer: true,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: adminOk
          ? `Pago realizado. Aviso al administrador enviado. No llegó al cliente (${customerEmail}). ${clienteError}`
          : `Pago realizado. No se pudo enviar al correo ${customerEmail}. ${clienteError}`,
        emailSent: adminOk,
        emailSentToCustomer: false,
        resendError: clienteError || undefined,
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
