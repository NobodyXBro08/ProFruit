import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { validateOrderCreate } from "@/lib/orderValidators";
import { createOrder, OrderError } from "@/lib/orders";

/** POST: crea un pedido (ítems + cliente), valida stock y descuenta inventario. */
export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateOrderCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const order = await createOrder(v.data);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error al crear el pedido.", details: message },
      { status: 500 }
    );
  }
}
