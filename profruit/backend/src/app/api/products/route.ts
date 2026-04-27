import { NextResponse } from "next/server";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "@/lib/products";
import { parseProductIdParam, validateProductCreate, validateProductUpdate } from "@/lib/productValidators";

/**
 * API REST de productos (entidad principal ProFruit) — GA7-220501096-AA5-EV03.
 * GET: lista completa o consulta por `?id=` | POST: crear | PUT: actualizar | DELETE: eliminar por `?id=`
 */
async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    const body = await request.json();
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 }),
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id !== null && id !== "") {
      const parsed = parseProductIdParam(id);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const product = await getProductById(parsed.id);
      if (!product) {
        return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
      }
      return NextResponse.json(product, { status: 200 });
    }

    const products = await listProducts();
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al obtener productos.", details: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateProductCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const product = await createProduct({
      name: v.data.name,
      description: v.data.description,
      price: v.data.price,
      stock: v.data.stock,
      weight: v.data.weight,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear el producto." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateProductUpdate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const updated = await updateProduct({
      id: v.data.id,
      name: v.data.name,
      description: v.data.description,
      price: v.data.price,
      stock: v.data.stock,
      weight: v.data.weight,
    });

    if (!updated) {
      return NextResponse.json({ error: "Producto no encontrado. No se pudo actualizar." }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto actualizado correctamente." }, { status: 200 });
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("El id es obligatorio")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar el producto." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const parsed = parseProductIdParam(id);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deleted = await deleteProduct(parsed.id);

    if (!deleted) {
      return NextResponse.json({ error: "Producto no encontrado. No se pudo eliminar." }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto eliminado correctamente." }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el producto." }, { status: 500 });
  }
}
