import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";

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

function frontendBase(): string {
  return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001")
    .trim()
    .replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      return NextResponse.json(
        {
          error: "Mercado Pago no está configurado.",
          hint: "Define MERCADOPAGO_ACCESS_TOKEN en el backend (.env).",
        },
        { status: 503, headers: corsHeaders }
      );
    }

    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const orderId = parseOrderId(raw.body);
    if (orderId === null) {
      return NextResponse.json({ error: "order_id inválido o ausente." }, { status: 400, headers: corsHeaders });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, total, status, customer_email, customer_name
       FROM orders WHERE id = ? LIMIT 1`,
      [orderId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404, headers: corsHeaders });
    }

    const order = rows[0];
    if (String(order.status) !== "pending") {
      return NextResponse.json({ error: "Solo se puede pagar un pedido pendiente." }, { status: 409, headers: corsHeaders });
    }

    const total = Number(order.total);
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Total del pedido inválido." }, { status: 400, headers: corsHeaders });
    }

    const base = frontendBase();
    const email = typeof order.customer_email === "string" ? order.customer_email.trim() : "";

    const preferenceBody = {
      items: [
        {
          id: String(orderId),
          title: `Pedido ProFruit #${orderId}`,
          description: "Frutas deshidratadas ProFruit",
          quantity: 1,
          currency_id: "COP",
          unit_price: total,
        },
      ],
      payer: email ? { email, name: String(order.customer_name || "") } : undefined,
      external_reference: String(orderId),
      back_urls: {
        success: `${base}/checkout?mp=success&order=${orderId}`,
        failure: `${base}/checkout?mp=failure&order=${orderId}`,
        pending: `${base}/checkout?mp=pending&order=${orderId}`,
      },
      auto_return: "approved",
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL?.trim() || undefined,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = (await mpRes.json().catch(() => ({}))) as Record<string, unknown>;

    if (!mpRes.ok) {
      console.error("Mercado Pago preference:", mpData);
      const msg =
        typeof mpData.message === "string"
          ? mpData.message
          : "No se pudo crear la preferencia de pago.";
      return NextResponse.json({ error: msg }, { status: 502, headers: corsHeaders });
    }

    const initPoint =
      (typeof mpData.init_point === "string" && mpData.init_point) ||
      (typeof mpData.sandbox_init_point === "string" && mpData.sandbox_init_point) ||
      null;

    if (!initPoint) {
      return NextResponse.json({ error: "Mercado Pago no devolvió URL de pago." }, { status: 502, headers: corsHeaders });
    }

    return NextResponse.json(
      {
        preference_id: mpData.id,
        init_point: initPoint,
        sandbox: token.startsWith("TEST-"),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("POST /api/pay/mercadopago:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500, headers: corsHeaders });
  }
}
