import { NextResponse } from "next/server";
import { corsHeaders, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { validateOrderCreate } from "@/lib/orderValidators";
import { createOrder, OrderError } from "@/lib/orders";
import { requireAuth } from "@/lib/requireAuth";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateOrderCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const order = await createOrder({ ...v.data, userId: auth.user.id });
    return NextResponse.json(order, { status: 201, headers: corsHeaders });
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
