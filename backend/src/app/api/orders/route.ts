import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { validateOrderCreate, validateOrderFinalize } from "@/lib/orderValidators";
import { createOrder, finalizePaidOrder, OrderError } from "@/lib/orders";

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

export async function PATCH(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateOrderFinalize(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    await finalizePaidOrder(v.id);
    return NextResponse.json(
      { message: "Pedido marcado como pagado. Stock total actualizado.", id: v.id, status: "paid" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error al actualizar el pedido.", details: message },
      { status: 500 }
    );
  }
}
