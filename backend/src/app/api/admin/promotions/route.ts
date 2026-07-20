import { NextResponse } from "next/server";
import { corsHeaders, corsJson, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody, parseQueryId } from "@/lib/http";
import {
  createPromotion,
  deletePromotion,
  getPromotionById,
  listPromotions,
  setPromotionActive,
  updatePromotion,
} from "@/lib/promotions";
import { validatePromotionBody } from "@/lib/promotionValidators";
import { requirePermission } from "@/lib/requireAuth";
import { getProductById } from "@/lib/products";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const auth = requirePermission(request, "promotions:manage");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id !== null && id !== "") {
      const parsed = parseQueryId(id);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
      }
      const promo = await getPromotionById(parsed.id);
      if (!promo) {
        return NextResponse.json({ error: "Promoción no encontrada." }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json(promo, { status: 200, headers: corsHeaders });
    }

    const list = await listPromotions();
    return corsJson(list, 200);
  } catch (error) {
    console.error("GET /api/admin/promotions:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ error: "Error al listar promociones.", details: message }, 500);
  }
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "promotions:manage");
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validatePromotionBody(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const product = await getProductById(v.data.productId);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404, headers: corsHeaders });
    }

    const created = await createPromotion(v.data);
    return NextResponse.json(created, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("POST /api/admin/promotions:", error);
    return NextResponse.json({ error: "Error al crear la promoción." }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: Request) {
  const auth = requirePermission(request, "promotions:manage");
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const body = raw.body as Record<string, unknown> | null;
    if (body && typeof body === "object" && body.id != null && typeof body.active === "boolean" && Object.keys(body).length <= 3) {
      const idRaw = body.id;
      const id = typeof idRaw === "number" ? idRaw : typeof idRaw === "string" ? Number(idRaw) : Number.NaN;
      if (!Number.isInteger(id) || id < 1) {
        return NextResponse.json({ error: "id inválido." }, { status: 400, headers: corsHeaders });
      }
      const updated = await setPromotionActive(id, body.active);
      if (!updated) {
        return NextResponse.json({ error: "Promoción no encontrada." }, { status: 404, headers: corsHeaders });
      }
      const promo = await getPromotionById(id);
      return NextResponse.json(promo, { status: 200, headers: corsHeaders });
    }

    const v = validatePromotionBody(raw.body, { requireId: true });
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const product = await getProductById(v.data.productId);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404, headers: corsHeaders });
    }

    const id = v.data.id!;
    const updated = await updatePromotion(id, v.data);
    if (!updated) {
      return NextResponse.json({ error: "Promoción no encontrada." }, { status: 404, headers: corsHeaders });
    }
    const promo = await getPromotionById(id);
    return NextResponse.json(promo, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("PUT /api/admin/promotions:", error);
    return NextResponse.json({ error: "Error al actualizar la promoción." }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  const auth = requirePermission(request, "promotions:manage");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseQueryId(searchParams.get("id"));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
    }

    const deleted = await deletePromotion(parsed.id);
    if (!deleted) {
      return NextResponse.json({ error: "Promoción no encontrada." }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ message: "Promoción eliminada." }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("DELETE /api/admin/promotions:", error);
    return NextResponse.json({ error: "Error al eliminar la promoción." }, { status: 500, headers: corsHeaders });
  }
}
