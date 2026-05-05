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

      const email = typeof order.email === "string" ? order.email.trim() : "";
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
    const to = String(order.email).trim();

    const { error: emailError } = await resend.emails.send({
      from,
      to,
      subject: "Confirmación de compra",
      text: `Tu pedido #${order.id} fue confirmado. Total: ${order.total}`,
    });

    if (emailError) {
      console.error("PAY Resend:", emailError);
      return NextResponse.json(
        {
          success: true,
          message: "Pago registrado; no se pudo enviar el correo.",
          emailSent: false,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Pago realizado y correo enviado", emailSent: true },
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
