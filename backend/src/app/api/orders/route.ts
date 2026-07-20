import { NextResponse } from "next/server";
import { corsHeaders, corsJson, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import { validateOrderCreate } from "@/lib/orderValidators";
import { createOrder, listOrdersForUser, OrderError } from "@/lib/orders";
import { requireAuth } from "@/lib/requireAuth";
import { updateUserProfile } from "@/lib/users";

export function OPTIONS(request: Request) {
  return corsOptionsResponse(request);
}

/** Lista pedidos del usuario autenticado. */
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const orders = await listOrdersForUser(auth.user.id);
    return corsJson({ orders }, 200, request);
  } catch (error) {
    console.error("GET /api/orders:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ error: "Error al listar pedidos.", details: message }, 500, request);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const body = raw.body as Record<string, unknown> | null;
    const v = validateOrderCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const order = await createOrder({ ...v.data, userId: auth.user.id });

    const saveProfile = body && typeof body === "object" && body.saveProfile === true;
    if (saveProfile) {
      try {
        await updateUserProfile(auth.user.id, {
          fullName: v.data.customerName,
          phone: v.data.customerPhone,
          city: v.data.city,
          address: v.data.address,
        });
      } catch (profileErr) {
        console.warn("orders/create: no se pudo guardar perfil:", profileErr);
      }
    }

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
