import { NextResponse } from "next/server";
import { corsHeaders, corsJson, corsOptionsResponse } from "@/lib/cors";
import { readJsonBody } from "@/lib/http";
import {
  adjustProductStock,
  InventoryError,
  listInventory,
  listStockMovements,
  setProductStockAbsolute,
} from "@/lib/inventory";
import { validateStockAdjust, validateStockSet } from "@/lib/inventoryValidators";
import { requirePermission } from "@/lib/requireAuth";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  const auth = requirePermission(request, "inventory:manage");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "movements") {
      const productIdRaw = searchParams.get("productId");
      const limitRaw = searchParams.get("limit");
      const productId =
        productIdRaw && productIdRaw !== ""
          ? Number(productIdRaw)
          : undefined;
      if (productId != null && (!Number.isInteger(productId) || productId < 1)) {
        return corsJson({ error: "productId inválido." }, 400);
      }
      const limit = limitRaw ? Number(limitRaw) : undefined;
      const movements = await listStockMovements({ productId, limit });
      return corsJson(movements, 200);
    }

    const inventory = await listInventory();
    return corsJson(inventory, 200);
  } catch (error) {
    console.error("GET /api/admin/inventory:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ error: "Error al obtener inventario.", details: message }, 500);
  }
}

export async function POST(request: Request) {
  const auth = requirePermission(request, "inventory:manage");
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const body = raw.body as Record<string, unknown> | null;
    const mode = body && typeof body === "object" ? body.mode : undefined;

    if (mode === "set") {
      const v = validateStockSet(raw.body);
      if (!v.ok) {
        return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
      }
      const result = await setProductStockAbsolute({
        productId: v.data.productId,
        userId: auth.user.id,
        stock: v.data.stock,
        note: v.data.note,
      });
      return NextResponse.json(result, { status: 200, headers: corsHeaders });
    }

    const v = validateStockAdjust(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const result = await adjustProductStock({
      productId: v.data.productId,
      userId: auth.user.id,
      delta: v.data.delta,
      note: v.data.note,
    });
    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    if (error instanceof InventoryError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode, headers: corsHeaders });
    }
    console.error("POST /api/admin/inventory:", error);
    return NextResponse.json({ error: "Error al actualizar el inventario." }, { status: 500, headers: corsHeaders });
  }
}
