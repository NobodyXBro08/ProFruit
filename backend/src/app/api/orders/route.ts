import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import type { ValidatedOrderCreate } from "@/lib/orderValidators";
import { validateOrderCreate, validateOrderFinalize } from "@/lib/orderValidators";
import { createOrder, finalizePaidOrder, OrderError } from "@/lib/orders";
import {
  buildOrderReceivedEmail,
  formatShippingLine,
  isValidEmail,
  normalizeEmail,
  sendWithResend,
} from "@/lib/mail";

export function OPTIONS() {
  return corsOptionsResponse();
}

async function notifyOrderReceived(
  orderId: number,
  input: ValidatedOrderCreate,
  total: number,
  lines: { name: string; quantity: number; lineTotal: number }[]
): Promise<{ emailSent: boolean; emailError?: string }> {
  if (input.paymentMethod !== "efectivo") {
    return { emailSent: false };
  }

  const email = normalizeEmail(input.customerEmail);
  if (!isValidEmail(email)) {
    return { emailSent: false, emailError: "Correo inválido." };
  }

  const text = buildOrderReceivedEmail({
    orderId,
    customerName: input.customerName,
    total,
    paymentMethod: input.paymentMethod,
    shippingLine: formatShippingLine(input.city, input.address),
    lines,
  });

  const result = await sendWithResend(email, `Pedido #${orderId} recibido - ProFruit`, text);

  const adminInbox = process.env.RESEND_ADMIN_EMAIL?.trim() || process.env.RESEND_TEST_INBOX?.trim() || "";
  if (adminInbox && normalizeEmail(adminInbox) !== email) {
    await sendWithResend(
      normalizeEmail(adminInbox),
      `Nuevo pedido #${orderId} - ProFruit`,
      text
    );
  }

  return { emailSent: result.sent, emailError: result.error };
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateOrderCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const order = await createOrder(v.data);

    const [productRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM products WHERE id IN (${order.items.map(() => "?").join(",")})`,
      order.items.map((i) => i.productId)
    );

    const nameById = new Map(productRows.map((r) => [Number(r.id), String(r.name)]));
    const emailLines = order.items.map((item) => ({
      name: nameById.get(item.productId) ?? `Producto #${item.productId}`,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));

    const mail = await notifyOrderReceived(order.id, v.data, order.total, emailLines);

    return NextResponse.json(
      {
        ...order,
        emailSent: mail.emailSent,
        emailError: mail.emailError ?? null,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error al crear el pedido.", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateOrderFinalize(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    await finalizePaidOrder(v.id);
    return NextResponse.json(
      { message: "Pedido marcado como pagado. Stock total actualizado.", id: v.id, status: "paid" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error al actualizar el pedido.", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
