import { NextResponse } from "next/server";
import { corsHeaders, corsJson, corsOptionsResponse } from "@/lib/cors";
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/lib/products";
import { readJsonBody, parseQueryId } from "@/lib/http";
import { validateProductCreate, validateProductUpdate } from "@/lib/productValidators";
import { requireAdmin } from "@/lib/requireAuth";

export function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
  try {
    const rows = await listProducts();
    return corsJson(rows, 200);
  } catch (error) {
    console.error("GET /api/products:", error);
    const message = error instanceof Error ? error.message : String(error);
    return corsJson({ error: message }, 500);
  }
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateProductCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const product = await createProduct({
      name: v.data.name,
      description: v.data.description,
      price: v.data.price,
      stock: v.data.stock,
      weight: v.data.weight,
      image: v.data.image,
    });
    return NextResponse.json(product, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear el producto." }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateProductUpdate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const updated = await updateProduct({
      id: v.data.id,
      name: v.data.name,
      description: v.data.description,
      price: v.data.price,
      stock: v.data.stock,
      weight: v.data.weight,
      image: v.data.image,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Producto no encontrado. No se pudo actualizar." },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ message: "Producto actualizado correctamente." }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("El id es obligatorio")) {
      return NextResponse.json({ error: msg }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ error: "Error al actualizar el producto." }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const parsed = parseQueryId(id);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
    }

    const deleted = await deleteProduct(parsed.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Producto no encontrado. No se pudo eliminar." },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ message: "Producto eliminado correctamente." }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el producto." }, { status: 500, headers: corsHeaders });
  }
}
