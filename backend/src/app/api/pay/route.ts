import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { deductStockForConfirmedOrder, OrderError } from "@/lib/orders";
import { parsePaymentMethod } from "@/lib/orderValidators";
import { requireAdmin } from "@/lib/requireAuth";
import { apiErrorFromUnknown } from "@/lib/apiError";

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

function paymentProviderFromNotes(notes: unknown): string {
  const s = typeof notes === "string" ? notes : "";
  const match = s.match(/payment_method:([a-z]+)/);
  return match?.[1] ?? "manual";
}

/** Admin: marca un pedido pendiente como pagado. */
export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

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
        "SELECT id, total, status, notes FROM orders WHERE id = ? FOR UPDATE",
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

    return NextResponse.json(
      {
        success: true,
        message: "Pedido marcado como pagado.",
        order_id: Number(order.id),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    return apiErrorFromUnknown("pay", error);
  }
}
