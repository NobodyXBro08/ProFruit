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

/** Trim, minúsculas y sin caracteres invisibles (Resend compara el destinatario al pie de la letra). */
function normalizeRecipientEmail(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

/** Resend suele incluir el correo permitido entre paréntesis en el 403 de modo prueba. */
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
      return NextResponse.json(
        {
          success: true,
          message:
            "Pago registrado; no se pudo enviar el correo. En Resend (modo prueba) define RESEND_TEST_INBOX=tu_correo_de_cuenta o verifica un dominio en resend.com/domains.",
          emailSent: false,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: testInbox
          ? "Pago realizado. Correo enviado a RESEND_TEST_INBOX (modo prueba)."
          : "Pago realizado y correo enviado",
        emailSent: true,
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
